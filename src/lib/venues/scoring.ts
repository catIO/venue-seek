import { getCategory, type CategoryId } from "./categories";

export type ScoreInput = {
    categories: CategoryId[];
    name: string;
    hasPerformanceSpace: boolean;
    rating?: number;
    ratingCount?: number;
    hasWebsite: boolean;
    hasPhone: boolean;
    distanceMiles: number;
    radiusMiles: number;
};

const MUSIC_KEYWORDS =
    /\b(concerts?|recitals?|music|guitar|arts?|performance|performing|hall|conservatory|auditorium)\b/i;
const MIN_REVIEWS_FOR_RATING = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Rule-based 0–100 fit for solo, unamplified classical guitar. */
export function scoreVenue(input: ScoreInput): number {
    const categoryWeight = Math.max(0, ...input.categories.map((id) => getCategory(id).weight));

    let score = categoryWeight * 50;
    if (MUSIC_KEYWORDS.test(input.name)) score += 15;
    if (input.hasPerformanceSpace) score += 15;
    if (input.rating !== undefined && (input.ratingCount ?? 0) >= MIN_REVIEWS_FOR_RATING) {
        score += clamp((input.rating - 3) / 2, 0, 1) * 15;
    }
    if (input.hasWebsite) score += 10;
    if (input.hasPhone) score += 5;
    if (input.radiusMiles > 0) {
        score += clamp(1 - input.distanceMiles / input.radiusMiles, 0, 1) * 5;
    }

    return Math.round(clamp(score, 0, 100));
}
