import "server-only";
import {
    getCategory,
    getPerformanceEvidence,
    hasPerformanceSpace,
    type CategoryId,
} from "@/lib/venues/categories";
import { haversineMiles, milesToMeters } from "@/lib/venues/geo";
import { scoreVenue } from "@/lib/venues/scoring";
import { estimateVenueSize } from "@/lib/venues/size";
import type { SearchRequest } from "@/lib/venues/searchSchema";
import type { LatLng, SearchResponse, Venue } from "@/lib/venues/types";
import { getPlaceLocation, resolveLocation, searchText, type RawPlace } from "./client";

export async function searchVenues(request: SearchRequest): Promise<SearchResponse | null> {
    const resolved = request.placeId
        ? await getPlaceLocation(request.placeId, request.sessionToken)
        : await resolveLocation(request.location);
    if (!resolved) return null;

    const radiusMeters = milesToMeters(request.radiusMiles);
    const perCategory = await Promise.all(
        request.categories.map(async (id) => {
            const category = getCategory(id);
            const places = await searchText({
                textQuery: category.textQuery,
                includedType: category.includedType,
                center: resolved.center,
                radiusMeters,
            });
            return { category, places };
        }),
    );

    const merged = new Map<string, { place: RawPlace; categories: Set<CategoryId> }>();
    for (const { category, places } of perCategory) {
        for (const place of places) {
            if (place.businessStatus && place.businessStatus !== "OPERATIONAL") continue;
            if (category.requiresPerformanceSpace && !hasPerformanceSpace(place.types)) continue;
            const existing = merged.get(place.id);
            if (existing) existing.categories.add(category.id);
            else merged.set(place.id, { place, categories: new Set([category.id]) });
        }
    }

    const venues = [...merged.values()]
        .map(({ place, categories }) =>
            toVenue(place, [...categories], resolved.center, request.radiusMiles),
        )
        .filter((v): v is Venue => v !== null && v.distanceMiles <= request.radiusMiles)
        .sort((a, b) => b.fitScore - a.fitScore || a.distanceMiles - b.distanceMiles);

    return {
        center: resolved.center,
        resolvedLocation: resolved.label,
        radiusMiles: request.radiusMiles,
        venues,
    };
}

function toVenue(
    place: RawPlace,
    categories: CategoryId[],
    center: LatLng,
    radiusMiles: number,
): Venue | null {
    const name = place.displayName?.text;
    if (!name || !place.location) return null;

    const location = { lat: place.location.latitude, lng: place.location.longitude };
    const distanceMiles = Math.round(haversineMiles(center, location) * 10) / 10;
    const performanceEvidence = getPerformanceEvidence(place.types)[0];
    const performanceSpace = Boolean(performanceEvidence);

    return {
        placeId: place.id,
        name,
        address: place.formattedAddress ?? "",
        location,
        categories,
        typeLabel: place.primaryTypeDisplayName?.text,
        hasPerformanceSpace: performanceSpace,
        performanceEvidence,
        size: estimateVenueSize({ name, types: place.types, categories }),
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        googleMapsUri: place.googleMapsUri,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        openingHours: place.regularOpeningHours?.weekdayDescriptions,
        distanceMiles,
        fitScore: scoreVenue({
            categories,
            name,
            performanceSignal: performanceEvidence?.strength,
            rating: place.rating,
            ratingCount: place.userRatingCount,
            hasWebsite: Boolean(place.websiteUri),
            hasPhone: Boolean(place.nationalPhoneNumber),
            distanceMiles,
            radiusMiles,
        }),
    };
}
