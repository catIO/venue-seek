// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { autocompleteLocations, PlacesApiError } from "@/lib/places/client";
import { GET } from "./route";

vi.mock("@/lib/places/client", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/places/client")>()),
    autocompleteLocations: vi.fn(),
}));

const TOKEN = "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10";

function get(query: string) {
    return GET(new Request(`http://localhost/api/locations/autocomplete?${query}`));
}

beforeEach(() => {
    vi.mocked(autocompleteLocations).mockReset();
});

describe("GET /api/locations/autocomplete", () => {
    it("returns suggestions for the trimmed input", async () => {
        const suggestions = [{ placeId: "ChIJasheville", mainText: "Asheville", secondaryText: "NC, USA" }];
        vi.mocked(autocompleteLocations).mockResolvedValue(suggestions);

        const response = await get(`input=%20Ashe%20&sessionToken=${TOKEN}`);

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ suggestions });
        expect(autocompleteLocations).toHaveBeenCalledWith("Ashe", TOKEN);
    });

    it("allows requests without a session token", async () => {
        vi.mocked(autocompleteLocations).mockResolvedValue([]);
        const response = await get("input=Ashe");
        expect(response.status).toBe(200);
        expect(autocompleteLocations).toHaveBeenCalledWith("Ashe", undefined);
    });

    it.each(["", "input=a", `input=Ashe&sessionToken=not-a-uuid`])(
        "rejects invalid query %j without calling Google",
        async (query) => {
            const response = await get(query);
            expect(response.status).toBe(400);
            expect(autocompleteLocations).not.toHaveBeenCalled();
        },
    );

    it("maps Places API errors to their status", async () => {
        vi.mocked(autocompleteLocations).mockRejectedValue(
            new PlacesApiError("GOOGLE_MAPS_API_KEY is not configured", 500),
        );
        const response = await get("input=Ashe");
        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: "GOOGLE_MAPS_API_KEY is not configured",
        });
    });
});
