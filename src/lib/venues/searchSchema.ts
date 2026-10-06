import { z } from "zod";
import { CATEGORY_IDS } from "./categories";

export const RADIUS_OPTIONS_MILES = [5, 10, 25] as const;

export const placeIdSchema = z.string().regex(/^[A-Za-z0-9_-]{10,300}$/, "Invalid place id");

export const sessionTokenSchema = z.uuid();

export const searchRequestSchema = z.object({
    location: z.string().trim().min(2, "Enter a city or ZIP code").max(100),
    radiusMiles: z.literal(RADIUS_OPTIONS_MILES),
    categories: z.array(z.enum(CATEGORY_IDS)).min(1, "Pick at least one venue type"),
    /** Set when the user picked an autocomplete suggestion. */
    placeId: placeIdSchema.optional(),
    sessionToken: sessionTokenSchema.optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const autocompleteQuerySchema = z.object({
    input: z.string().trim().min(2).max(100),
    sessionToken: sessionTokenSchema.optional(),
});
