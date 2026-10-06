// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlaceSummary, PlacesApiError } from "@/lib/places/client";
import { GET } from "./route";

vi.mock("@/lib/places/client", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/places/client")>()),
    getPlaceSummary: vi.fn(),
}));

function get(placeId: string) {
    return GET(new Request(`http://localhost/api/venues/${placeId}/summary`), {
        params: Promise.resolve({ placeId }),
    });
}

beforeEach(() => {
    vi.mocked(getPlaceSummary).mockReset();
});

describe("GET /api/venues/[placeId]/summary", () => {
    it("returns the place summary", async () => {
        const summary = { placeId: "ChIJN1t_tDeuEmsR", editorialSummary: "Nice." };
        vi.mocked(getPlaceSummary).mockResolvedValue(summary);

        const response = await get("ChIJN1t_tDeuEmsR");

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(summary);
        expect(getPlaceSummary).toHaveBeenCalledWith("ChIJN1t_tDeuEmsR");
    });

    it("rejects invalid place ids without calling Google", async () => {
        const response = await get("../../etc");
        expect(response.status).toBe(400);
        expect(getPlaceSummary).not.toHaveBeenCalled();
    });

    it("maps Places API errors to their status", async () => {
        vi.mocked(getPlaceSummary).mockRejectedValue(new PlacesApiError("Places API request failed (404)", 502));
        const response = await get("ChIJN1t_tDeuEmsR");
        expect(response.status).toBe(502);
    });
});
