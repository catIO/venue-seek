import type { CategoryId } from "./categories";
import type { VenueSize } from "./size";

export type LatLng = { lat: number; lng: number };

export type Venue = {
    placeId: string;
    name: string;
    address: string;
    location: LatLng;
    categories: CategoryId[];
    typeLabel?: string;
    hasPerformanceSpace: boolean;
    /** Estimated, not from Google. */
    size: VenueSize;
    phone?: string;
    website?: string;
    googleMapsUri?: string;
    rating?: number;
    ratingCount?: number;
    openingHours?: string[];
    distanceMiles: number;
    fitScore: number;
};

export type SearchResponse = {
    center: LatLng;
    resolvedLocation: string;
    radiusMiles: number;
    venues: Venue[];
};

export type AiSummary = { text: string; disclosure?: string };

export type VenueSummary = {
    placeId: string;
    editorialSummary?: string;
    generativeSummary?: AiSummary;
    reviewSummary?: AiSummary;
    liveMusic?: boolean;
};

export type LocationSuggestion = {
    placeId: string;
    mainText: string;
    secondaryText?: string;
};
