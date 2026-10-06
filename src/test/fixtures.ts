import type { SearchResponse, Venue } from "@/lib/venues/types";

export function makeVenue(overrides: Partial<Venue> = {}): Venue {
    return {
        placeId: "ChIJ_test_place_1",
        name: "Downtown Library",
        address: "1 Main St, Asheville, NC 28801",
        location: { lat: 35.595, lng: -82.551 },
        categories: ["library"],
        typeLabel: "Library",
        hasPerformanceSpace: false,
        size: "small",
        phone: "(828) 555-0100",
        website: "https://library.example.org",
        googleMapsUri: "https://maps.google.com/?cid=1",
        rating: 4.7,
        ratingCount: 120,
        openingHours: ["Monday: 9:00 AM – 6:00 PM"],
        distanceMiles: 0.4,
        fitScore: 88,
        ...overrides,
    };
}

export function makeSearchResponse(venues: Venue[] = [makeVenue()]): SearchResponse {
    return {
        center: { lat: 35.595, lng: -82.551 },
        resolvedLocation: "Asheville, NC, USA",
        radiusMiles: 10,
        venues,
    };
}

export function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
