import type { CategoryId } from "./categories";

export const VENUE_SIZES = [
    { id: "intimate", label: "Intimate", range: "under 50" },
    { id: "small", label: "Small", range: "50–150" },
    { id: "medium", label: "Medium", range: "150–500" },
    { id: "large", label: "Large", range: "500+" },
] as const;

export type VenueSize = (typeof VENUE_SIZES)[number]["id"];

export const DEFAULT_VENUE_SIZES: VenueSize[] = ["intimate", "small", "medium"];

const LARGE_NAME = /\b(arena|stadium|coliseum|amphitheat(er|re)|civic cent(er|re)|convention|auditorium|cathedral|basilica)\b/i;
const INTIMATE_NAME = /\b(listening room|house concerts?|salon)\b/i;

const LARGE_TYPES = ["arena", "stadium", "amphitheatre", "opera_house", "philharmonic_hall", "convention_center", "concert_hall", "auditorium"];
const VENUE_TYPES = ["performing_arts_theater", "live_music_venue", "event_venue"];
const BAR_TYPES = ["bar", "pub", "restaurant", "night_club"];
const MEDIUM_TYPES = ["church", "place_of_worship"];
const SMALL_TYPES = ["library", "community_center", "museum", "university", "school", "educational_institution"];
const INTIMATE_TYPES = ["book_store", "cafe", "coffee_shop", "art_gallery", "wine_bar", "winery"];

const SIZE_BY_CATEGORY: Record<CategoryId, VenueSize> = {
    recital_hall: "medium",
    music_school: "small",
    library: "small",
    church: "medium",
    book_store: "intimate",
    community_center: "small",
    senior_center: "small",
    art_gallery: "intimate",
    museum: "small",
    winery: "intimate",
    cafe: "intimate",
};

/** Heuristic audience-size estimate; Google Places has no capacity data. */
export function estimateVenueSize(input: {
    name: string;
    types?: readonly string[];
    categories: readonly CategoryId[];
}): VenueSize {
    const types = input.types ?? [];
    const has = (list: readonly string[]) => types.some((t) => list.includes(t));

    if (INTIMATE_NAME.test(input.name)) return "intimate";
    if (LARGE_NAME.test(input.name)) return "large";
    if (has(LARGE_TYPES)) return "large";
    if (has(VENUE_TYPES)) return has(BAR_TYPES) || has(INTIMATE_TYPES) ? "small" : "medium";
    if (has(MEDIUM_TYPES)) return "medium";
    if (has(INTIMATE_TYPES)) return "intimate";
    if (has(SMALL_TYPES)) return "small";
    return input.categories.length > 0 ? SIZE_BY_CATEGORY[input.categories[0]] : "small";
}

export function getVenueSize(id: VenueSize) {
    return VENUE_SIZES.find((size) => size.id === id)!;
}
