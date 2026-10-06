export const CATEGORY_IDS = [
    "recital_hall",
    "music_school",
    "library",
    "church",
    "book_store",
    "community_center",
    "senior_center",
    "art_gallery",
    "museum",
    "winery",
    "cafe",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/** Google place types that indicate an actual performance or event space. */
export const PERFORMANCE_SPACE_TYPES: readonly string[] = [
    "concert_hall",
    "auditorium",
    "performing_arts_theater",
    "live_music_venue",
    "event_venue",
    "amphitheatre",
    "opera_house",
    "philharmonic_hall",
];

export function hasPerformanceSpace(types: readonly string[] | undefined): boolean {
    return types?.some((type) => PERFORMANCE_SPACE_TYPES.includes(type)) ?? false;
}

export type VenueCategory = {
    id: CategoryId;
    label: string;
    textQuery: string;
    /** Places API Table A type used to bias results. */
    includedType?: string;
    /** Drop results without a performance-space type (e.g. private lesson studios, teachers). */
    requiresPerformanceSpace?: boolean;
    /** 0–1 suitability for solo, unamplified classical performance. */
    weight: number;
};

export const VENUE_CATEGORIES: readonly VenueCategory[] = [
    { id: "recital_hall", label: "Recital & concert halls", textQuery: "concert hall", requiresPerformanceSpace: true, weight: 1 },
    { id: "music_school", label: "Music schools with performance space", textQuery: "music school", requiresPerformanceSpace: true, weight: 0.85 },
    { id: "library", label: "Libraries", textQuery: "public library", includedType: "library", weight: 0.9 },
    { id: "church", label: "Churches", textQuery: "church", includedType: "church", weight: 0.8 },
    { id: "book_store", label: "Bookstores", textQuery: "independent bookstore", includedType: "book_store", weight: 0.8 },
    { id: "community_center", label: "Community centers", textQuery: "community center", includedType: "community_center", weight: 0.8 },
    { id: "senior_center", label: "Senior centers", textQuery: "senior center", weight: 0.75 },
    { id: "art_gallery", label: "Art galleries", textQuery: "art gallery", includedType: "art_gallery", weight: 0.7 },
    { id: "museum", label: "Museums", textQuery: "museum", includedType: "museum", weight: 0.7 },
    { id: "winery", label: "Wineries & wine bars", textQuery: "winery wine bar", weight: 0.6 },
    { id: "cafe", label: "Cafés", textQuery: "coffee shop", includedType: "cafe", weight: 0.5 },
];

export const DEFAULT_CATEGORY_IDS: CategoryId[] = [
    "recital_hall",
    "music_school",
    "library",
    "church",
    "book_store",
    "community_center",
];

const categoriesById = new Map(VENUE_CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): VenueCategory {
    const category = categoriesById.get(id);
    if (!category) throw new Error(`Unknown category: ${id}`);
    return category;
}
