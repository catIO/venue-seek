// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RawPlace } from "./client";
import { getPlaceLocation, resolveLocation, searchText } from "./client";
import { searchVenues } from "./searchVenues";

vi.mock("./client", () => ({
    getPlaceLocation: vi.fn(),
    resolveLocation: vi.fn(),
    searchText: vi.fn(),
}));

const center = { lat: 35.5951, lng: -82.5515 };

function rawPlace(overrides: Partial<RawPlace> & { id: string }): RawPlace {
    return {
        displayName: { text: overrides.id },
        formattedAddress: "Asheville, NC",
        location: { latitude: center.lat, longitude: center.lng },
        businessStatus: "OPERATIONAL",
        ...overrides,
    };
}

beforeEach(() => {
    vi.mocked(getPlaceLocation).mockReset();
    vi.mocked(resolveLocation).mockReset();
    vi.mocked(searchText).mockReset();
});

describe("searchVenues", () => {
    it("uses the selected place id instead of text resolution", async () => {
        vi.mocked(getPlaceLocation).mockResolvedValue({ center, label: "Asheville, NC, USA" });
        vi.mocked(searchText).mockResolvedValue([]);

        const result = await searchVenues({
            location: "Asheville, NC, USA",
            radiusMiles: 10,
            categories: ["library"],
            placeId: "ChIJCW8PPKmMWYgRXTo0BsEx75Q",
            sessionToken: "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10",
        });

        expect(getPlaceLocation).toHaveBeenCalledWith(
            "ChIJCW8PPKmMWYgRXTo0BsEx75Q",
            "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10",
        );
        expect(resolveLocation).not.toHaveBeenCalled();
        expect(result?.center).toEqual(center);
    });

    it("returns null when the location can't be resolved", async () => {
        vi.mocked(resolveLocation).mockResolvedValue(null);

        await expect(
            searchVenues({ location: "zzz", radiusMiles: 10, categories: ["library"] }),
        ).resolves.toBeNull();
        expect(searchText).not.toHaveBeenCalled();
    });

    it("searches each category, merges duplicates, filters and ranks venues", async () => {
        vi.mocked(resolveLocation).mockResolvedValue({ center, label: "Asheville, NC, USA" });
        vi.mocked(searchText).mockImplementation(async ({ textQuery }) => {
            if (textQuery === "public library") {
                return [
                    rawPlace({ id: "library", websiteUri: "https://lib.example.org" }),
                    rawPlace({ id: "shared" }),
                    rawPlace({ id: "closed", businessStatus: "CLOSED_PERMANENTLY" }),
                ];
            }
            return [
                rawPlace({ id: "shared" }),
                // ~70 miles away, outside a 10 mile radius
                rawPlace({ id: "far", location: { latitude: 36.6, longitude: -82.55 } }),
                rawPlace({ id: "nameless", displayName: undefined }),
            ];
        });

        const result = await searchVenues({
            location: "Asheville",
            radiusMiles: 10,
            categories: ["library", "cafe"],
        });

        expect(searchText).toHaveBeenCalledTimes(2);
        expect(searchText).toHaveBeenCalledWith({
            textQuery: "public library",
            includedType: "library",
            center,
            radiusMeters: expect.closeTo(16093.44, 2),
        });
        expect(result?.resolvedLocation).toBe("Asheville, NC, USA");
        expect(result?.venues.map((v) => v.placeId)).toEqual(["library", "shared"]);
        expect(result?.venues[1].categories).toEqual(["library", "cafe"]);
        expect(result?.venues[0]).toMatchObject({
            website: "https://lib.example.org",
            distanceMiles: 0,
            hasPerformanceSpace: false,
        });
    });

    it("drops lesson studios and teachers from categories that require a performance space", async () => {
        vi.mocked(resolveLocation).mockResolvedValue({ center, label: "Asheville, NC, USA" });
        vi.mocked(searchText).mockResolvedValue([
            rawPlace({
                id: "Tim McWilliams Music",
                types: ["school", "educational_institution", "association_or_organization", "service"],
            }),
            rawPlace({
                id: "Academy for the Arts",
                types: ["school", "educational_institution", "live_music_venue", "event_venue"],
            }),
            rawPlace({ id: "Untyped" }),
        ]);

        const result = await searchVenues({
            location: "Asheville",
            radiusMiles: 10,
            categories: ["music_school"],
        });

        expect(result?.venues.map((v) => v.placeId)).toEqual(["Academy for the Arts"]);
        expect(result?.venues[0].hasPerformanceSpace).toBe(true);
        expect(result?.venues[0].size).toBe("medium");
    });

    it("keeps places without performance types in other categories", async () => {
        vi.mocked(resolveLocation).mockResolvedValue({ center, label: "Asheville, NC, USA" });
        vi.mocked(searchText).mockResolvedValue([
            rawPlace({ id: "Pack Library", types: ["library"] }),
        ]);

        const result = await searchVenues({
            location: "Asheville",
            radiusMiles: 10,
            categories: ["library"],
        });

        expect(result?.venues.map((v) => v.placeId)).toEqual(["Pack Library"]);
    });
});
