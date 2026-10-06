// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlacesApiError } from "@/lib/places/client";
import { searchVenues } from "@/lib/places/searchVenues";
import { makeSearchResponse } from "@/test/fixtures";
import { POST } from "./route";

vi.mock("@/lib/places/searchVenues", () => ({ searchVenues: vi.fn() }));

const validBody = { location: "Asheville, NC", radiusMiles: 10, categories: ["library"] };

function post(body: string) {
    return POST(
        new Request("http://localhost/api/venues/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        }),
    );
}

beforeEach(() => {
    vi.mocked(searchVenues).mockReset();
});

describe("POST /api/venues/search", () => {
    it("returns search results", async () => {
        const data = makeSearchResponse();
        vi.mocked(searchVenues).mockResolvedValue(data);

        const response = await post(JSON.stringify(validBody));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(data);
        expect(searchVenues).toHaveBeenCalledWith(validBody);
    });

    it("rejects malformed JSON", async () => {
        const response = await post("{not json");
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body" });
    });

    it("rejects invalid requests with the first validation message", async () => {
        const response = await post(JSON.stringify({ ...validBody, categories: [] }));
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: "Pick at least one venue type" });
        expect(searchVenues).not.toHaveBeenCalled();
    });

    it("returns 404 when the location isn't found", async () => {
        vi.mocked(searchVenues).mockResolvedValue(null);
        const response = await post(JSON.stringify(validBody));
        expect(response.status).toBe(404);
    });

    it("maps Places API errors to their status", async () => {
        vi.mocked(searchVenues).mockRejectedValue(new PlacesApiError("Places API request failed (403)", 502));
        const response = await post(JSON.stringify(validBody));
        expect(response.status).toBe(502);
        await expect(response.json()).resolves.toEqual({ error: "Places API request failed (403)" });
    });
});
