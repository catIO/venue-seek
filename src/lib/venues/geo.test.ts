import { describe, expect, it } from "vitest";
import { haversineMiles, milesToMeters } from "./geo";

describe("haversineMiles", () => {
    it("returns 0 for the same point", () => {
        expect(haversineMiles({ lat: 40, lng: -74 }, { lat: 40, lng: -74 })).toBe(0);
    });

    it("approximates the NYC to LA distance", () => {
        const nyc = { lat: 40.7128, lng: -74.006 };
        const la = { lat: 34.0522, lng: -118.2437 };
        expect(haversineMiles(nyc, la)).toBeCloseTo(2445, -1);
    });
});

describe("milesToMeters", () => {
    it("converts miles to meters", () => {
        expect(milesToMeters(25)).toBeCloseTo(40233.6, 1);
    });
});
