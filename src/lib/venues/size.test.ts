import { describe, expect, it } from "vitest";
import { estimateVenueSize, getVenueSize } from "./size";

describe("estimateVenueSize", () => {
    it.each([
        // Real Asheville results from Places API
        ["Harrah's Cherokee Center - Asheville", ["auditorium", "arena", "event_venue"], "large"],
        ["Thomas Wolfe Auditorium", ["live_music_venue", "event_venue"], "large"],
        ["Wortham Center for the Performing Arts", ["performing_arts_theater", "event_venue"], "medium"],
        ["The Grey Eagle Music Hall and Pub", ["live_music_venue", "pub", "bar"], "small"],
        ["AyurPrana Listening Room", ["live_music_venue", "concert_hall", "auditorium"], "intimate"],
        ["Firestorm Books", ["book_store", "event_venue"], "small"],
        ["Malaprop's Bookstore", ["book_store", "store"], "intimate"],
        ["Pack Memorial Library", ["library"], "small"],
        ["University Concert Hall", ["university", "event_venue"], "medium"],
        ["First Baptist Church", ["church", "place_of_worship"], "medium"],
        ["Basilica of St. Lawrence", ["church"], "large"],
    ] as const)("%s → %s", (name, types, expected) => {
        expect(estimateVenueSize({ name, types, categories: [] })).toBe(expected);
    });

    it("falls back to the category when Google provides no useful types", () => {
        expect(estimateVenueSize({ name: "Oak Room", types: [], categories: ["cafe"] })).toBe("intimate");
        expect(estimateVenueSize({ name: "Oak Room", categories: ["recital_hall"] })).toBe("medium");
        expect(estimateVenueSize({ name: "Oak Room", categories: ["university_conservatory"] })).toBe("medium");
        expect(estimateVenueSize({ name: "Oak Room", categories: [] })).toBe("small");
    });
});

describe("getVenueSize", () => {
    it("returns the label and range", () => {
        expect(getVenueSize("small")).toEqual({ id: "small", label: "Small", range: "50–150" });
    });
});
