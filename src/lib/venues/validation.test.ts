import { describe, expect, it } from "vitest";
import { autocompleteQuerySchema, placeIdSchema, searchRequestSchema } from "./searchSchema";
import { safeExternalUrl } from "./url";
import { CATEGORY_IDS, VENUE_CATEGORIES } from "./categories";

describe("searchRequestSchema", () => {
    const valid = { location: "  Asheville, NC ", radiusMiles: 10, categories: ["library"] };

    it("accepts and trims a valid request", () => {
        expect(searchRequestSchema.parse(valid)).toEqual({ ...valid, location: "Asheville, NC" });
    });

    it("accepts a selected place with its session token", () => {
        const input = {
            ...valid,
            placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
            sessionToken: "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10",
        };
        expect(searchRequestSchema.safeParse(input).success).toBe(true);
    });

    it.each([
        ["unsupported radius", { ...valid, radiusMiles: 100 }],
        ["unknown category", { ...valid, categories: ["nightclub"] }],
        ["no categories", { ...valid, categories: [] }],
        ["blank location", { ...valid, location: " " }],
        ["overlong location", { ...valid, location: "x".repeat(101) }],
        ["invalid place id", { ...valid, placeId: "../evil" }],
        ["non-uuid session token", { ...valid, sessionToken: "abc" }],
    ])("rejects %s", (_label, input) => {
        expect(searchRequestSchema.safeParse(input).success).toBe(false);
    });
});

describe("autocompleteQuerySchema", () => {
    it("accepts input with an optional session token", () => {
        expect(autocompleteQuerySchema.safeParse({ input: "Ashe" }).success).toBe(true);
        expect(
            autocompleteQuerySchema.safeParse({
                input: "Ashe",
                sessionToken: "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10",
            }).success,
        ).toBe(true);
    });

    it.each([{ input: "a" }, { input: "x".repeat(101) }, { input: "Ashe", sessionToken: "nope" }])(
        "rejects %o",
        (input) => {
            expect(autocompleteQuerySchema.safeParse(input).success).toBe(false);
        },
    );
});

describe("placeIdSchema", () => {
    it("accepts Google place ids", () => {
        expect(placeIdSchema.safeParse("ChIJN1t_tDeuEmsRUsoyG83frY4").success).toBe(true);
    });

    it.each(["../../secrets", "abc", "ChIJ%2F..%2Fevil-path"])("rejects %s", (id) => {
        expect(placeIdSchema.safeParse(id).success).toBe(false);
    });
});

describe("safeExternalUrl", () => {
    it("allows http and https", () => {
        expect(safeExternalUrl("https://example.org/events")).toBe("https://example.org/events");
        expect(safeExternalUrl("http://example.org/")).toBe("http://example.org/");
    });

    it.each([undefined, "", "javascript:alert(1)", "not a url", "ftp://example.org"])(
        "rejects %s",
        (value) => {
            expect(safeExternalUrl(value)).toBeUndefined();
        },
    );
});

describe("VENUE_CATEGORIES", () => {
    it("defines every category id exactly once", () => {
        expect(VENUE_CATEGORIES.map((c) => c.id).sort()).toEqual([...CATEGORY_IDS].sort());
    });
});
