// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/fixtures";
import {
    autocompleteLocations,
    getPlaceLocation,
    getPlaceSummary,
    PlacesApiError,
    resolveLocation,
    SEARCH_FIELD_MASK,
    searchText,
    SUMMARY_FIELD_MASK,
} from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
});

function lastRequest() {
    const [url, init] = fetchMock.mock.calls[0];
    return {
        url: String(url),
        headers: init?.headers as Record<string, string>,
        method: init?.method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
}

describe("searchText", () => {
    it("sends a location-biased text search with the search field mask", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ places: [{ id: "p1" }] }));

        const places = await searchText({
            textQuery: "public library",
            includedType: "library",
            center: { lat: 35.5, lng: -82.5 },
            radiusMeters: 16093,
        });

        expect(places).toEqual([{ id: "p1" }]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const request = lastRequest();
        expect(request.url).toBe("https://places.googleapis.com/v1/places:searchText");
        expect(request.method).toBe("POST");
        expect(request.headers["X-Goog-Api-Key"]).toBe("test-key");
        expect(request.headers["X-Goog-FieldMask"]).toBe(SEARCH_FIELD_MASK);
        expect(request.body).toEqual({
            textQuery: "public library",
            includedType: "library",
            pageSize: 20,
            regionCode: "us",
            locationBias: {
                circle: { center: { latitude: 35.5, longitude: -82.5 }, radius: 16093 },
            },
        });
    });

    it("returns an empty list when Places has no results", async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));
        await expect(
            searchText({ textQuery: "x", center: { lat: 0, lng: 0 }, radiusMeters: 1 }),
        ).resolves.toEqual([]);
    });

    it("throws a 502 PlacesApiError on upstream failure", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        fetchMock.mockResolvedValue(jsonResponse({ error: "denied" }, 403));

        const promise = searchText({ textQuery: "x", center: { lat: 0, lng: 0 }, radiusMeters: 1 });
        await expect(promise).rejects.toBeInstanceOf(PlacesApiError);
        await expect(promise).rejects.toMatchObject({ status: 502 });
    });

    it("throws a 500 PlacesApiError when the API key is missing", async () => {
        vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
        await expect(
            searchText({ textQuery: "x", center: { lat: 0, lng: 0 }, radiusMeters: 1 }),
        ).rejects.toMatchObject({ status: 500 });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("resolveLocation", () => {
    it("returns the center and formatted address of the top match", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                places: [
                    { location: { latitude: 35.59, longitude: -82.55 }, formattedAddress: "Asheville, NC, USA" },
                ],
            }),
        );

        await expect(resolveLocation("Asheville")).resolves.toEqual({
            center: { lat: 35.59, lng: -82.55 },
            label: "Asheville, NC, USA",
        });
        expect(lastRequest().body).toEqual({ textQuery: "Asheville", pageSize: 1, regionCode: "us" });
    });

    it("returns null when nothing matches", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ places: [] }));
        await expect(resolveLocation("nowhere")).resolves.toBeNull();
    });
});

describe("getPlaceSummary", () => {
    it("fetches place details with the summary field mask and maps the response", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                id: "ChIJabc",
                editorialSummary: { text: "Historic library." },
                generativeSummary: {
                    overview: { text: "Quiet library with a reading room." },
                    disclosureText: { text: "Summarized with Gemini" },
                },
                reviewSummary: { text: { text: "People love the events." } },
                liveMusic: true,
                types: ["event_venue", "live_music_venue"],
            }),
        );

        await expect(getPlaceSummary("ChIJabc")).resolves.toEqual({
            placeId: "ChIJabc",
            editorialSummary: "Historic library.",
            generativeSummary: {
                text: "Quiet library with a reading room.",
                disclosure: "Summarized with Gemini",
            },
            reviewSummary: { text: "People love the events.", disclosure: undefined },
            liveMusic: true,
            performanceEvidence: [
                { type: "live_music_venue", label: "Live music venue", strength: "direct" },
                { type: "event_venue", label: "Event venue", strength: "contextual" },
            ],
        });

        const request = lastRequest();
        expect(request.url).toBe("https://places.googleapis.com/v1/places/ChIJabc");
        expect(request.method).toBe("GET");
        expect(request.headers["X-Goog-FieldMask"]).toBe(SUMMARY_FIELD_MASK);
    });

    it("omits summaries Google doesn't provide", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ id: "ChIJabc" }));
        await expect(getPlaceSummary("ChIJabc")).resolves.toEqual({
            placeId: "ChIJabc",
            editorialSummary: undefined,
            generativeSummary: undefined,
            reviewSummary: undefined,
            liveMusic: undefined,
            performanceEvidence: [],
        });
    });
});

describe("autocompleteLocations", () => {
    it("requests US region predictions with the session token and maps them", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                suggestions: [
                    {
                        placePrediction: {
                            placeId: "ChIJasheville",
                            text: { text: "Asheville, NC, USA" },
                            structuredFormat: {
                                mainText: { text: "Asheville" },
                                secondaryText: { text: "NC, USA" },
                            },
                        },
                    },
                    { placePrediction: { placeId: "ChIJ28801", text: { text: "28801" } } },
                    { placePrediction: { text: { text: "no id" } } },
                ],
            }),
        );

        await expect(autocompleteLocations("Ashe", "token-1")).resolves.toEqual([
            { placeId: "ChIJasheville", mainText: "Asheville", secondaryText: "NC, USA" },
            { placeId: "ChIJ28801", mainText: "28801", secondaryText: undefined },
        ]);

        const request = lastRequest();
        expect(request.url).toBe("https://places.googleapis.com/v1/places:autocomplete");
        expect(request.method).toBe("POST");
        expect(request.body).toEqual({
            input: "Ashe",
            includedPrimaryTypes: ["(regions)"],
            includedRegionCodes: ["us"],
            sessionToken: "token-1",
        });
    });

    it("returns an empty list when there are no suggestions", async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));
        await expect(autocompleteLocations("zzzz")).resolves.toEqual([]);
    });
});

describe("getPlaceLocation", () => {
    it("fetches the place location, passing the session token to close the session", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                location: { latitude: 35.59, longitude: -82.55 },
                formattedAddress: "Asheville, NC, USA",
            }),
        );

        await expect(getPlaceLocation("ChIJasheville", "token-1")).resolves.toEqual({
            center: { lat: 35.59, lng: -82.55 },
            label: "Asheville, NC, USA",
        });

        const request = lastRequest();
        expect(request.url).toBe(
            "https://places.googleapis.com/v1/places/ChIJasheville?sessionToken=token-1",
        );
        expect(request.method).toBe("GET");
        expect(request.headers["X-Goog-FieldMask"]).toBe("location,formattedAddress");
    });

    it("omits the session token when none is given and returns null without a location", async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));

        await expect(getPlaceLocation("ChIJasheville")).resolves.toBeNull();
        expect(lastRequest().url).toBe("https://places.googleapis.com/v1/places/ChIJasheville");
    });
});
