import { describe, expect, it } from "vitest";
import { scoreVenue, type ScoreInput } from "./scoring";

const base: ScoreInput = {
    categories: ["library"],
    name: "Pack Library",
    hasPerformanceSpace: false,
    hasWebsite: false,
    hasPhone: false,
    distanceMiles: 10,
    radiusMiles: 10,
};

describe("scoreVenue", () => {
    it("scores an ideal venue at 100", () => {
        expect(
            scoreVenue({
                categories: ["recital_hall"],
                name: "Diana Wortham Recital Hall",
                hasPerformanceSpace: true,
                rating: 5,
                ratingCount: 200,
                hasWebsite: true,
                hasPhone: true,
                distanceMiles: 0,
                radiusMiles: 10,
            }),
        ).toBe(100);
    });

    it("uses the category weight as the baseline", () => {
        expect(scoreVenue(base)).toBe(45);
        expect(scoreVenue({ ...base, categories: ["cafe"], name: "Bean Co" })).toBe(25);
    });

    it("uses the best category when a venue matches several", () => {
        expect(scoreVenue({ ...base, categories: ["cafe", "library"] })).toBe(45);
    });

    it("boosts names with music keywords", () => {
        expect(scoreVenue({ ...base, name: "Library Concert Hall" })).toBe(60);
    });

    it("boosts places Google types as performance spaces", () => {
        expect(scoreVenue({ ...base, hasPerformanceSpace: true })).toBe(60);
    });

    it("ignores ratings with too few reviews", () => {
        expect(scoreVenue({ ...base, rating: 5, ratingCount: 4 })).toBe(45);
        expect(scoreVenue({ ...base, rating: 5, ratingCount: 5 })).toBe(60);
    });

    it("does not penalize ratings below 3", () => {
        expect(scoreVenue({ ...base, rating: 1, ratingCount: 50 })).toBe(45);
    });

    it("rewards contact info and proximity", () => {
        expect(scoreVenue({ ...base, hasWebsite: true, hasPhone: true, distanceMiles: 0 })).toBe(65);
    });
});
