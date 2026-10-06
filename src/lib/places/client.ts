import "server-only";
import type { LatLng, LocationSuggestion, VenueSummary } from "@/lib/venues/types";

const PLACES_BASE_URL = "https://places.googleapis.com/v1";
const PAGE_SIZE = 20;

// Enterprise SKU fields; summaries (Atmosphere SKU) are fetched on demand via getPlaceSummary.
export const SEARCH_FIELD_MASK = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.businessStatus",
    "places.primaryTypeDisplayName",
    "places.types",
    "places.googleMapsUri",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "places.regularOpeningHours",
].join(",");

export const SUMMARY_FIELD_MASK = [
    "id",
    "editorialSummary",
    "generativeSummary",
    "reviewSummary",
    "liveMusic",
].join(",");

type LocalizedText = { text?: string };

export type RawPlace = {
    id: string;
    displayName?: LocalizedText;
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    businessStatus?: string;
    primaryTypeDisplayName?: LocalizedText;
    types?: string[];
    googleMapsUri?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
};

type RawSummaryPlace = {
    id: string;
    editorialSummary?: LocalizedText;
    generativeSummary?: { overview?: LocalizedText; disclosureText?: LocalizedText };
    reviewSummary?: { text?: LocalizedText; disclosureText?: LocalizedText };
    liveMusic?: boolean;
};

type RawAutocompleteResponse = {
    suggestions?: {
        placePrediction?: {
            placeId?: string;
            text?: LocalizedText;
            structuredFormat?: { mainText?: LocalizedText; secondaryText?: LocalizedText };
        };
    }[];
};

export type ResolvedLocation = { center: LatLng; label: string };

export class PlacesApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = "PlacesApiError";
    }
}

async function placesFetch<T>(
    path: string,
    { fieldMask, body }: { fieldMask: string; body?: unknown },
): Promise<T> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new PlacesApiError("GOOGLE_MAPS_API_KEY is not configured", 500);

    const response = await fetch(`${PLACES_BASE_URL}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
    });

    if (!response.ok) {
        console.error(`Places API ${response.status}: ${await response.text()}`);
        throw new PlacesApiError(`Places API request failed (${response.status})`, 502);
    }
    return (await response.json()) as T;
}

export async function resolveLocation(query: string): Promise<ResolvedLocation | null> {
    const data = await placesFetch<{ places?: RawPlace[] }>("/places:searchText", {
        fieldMask: "places.location,places.formattedAddress",
        body: { textQuery: query, pageSize: 1, regionCode: "us" },
    });
    const place = data.places?.[0];
    if (!place?.location) return null;
    return {
        center: { lat: place.location.latitude, lng: place.location.longitude },
        label: place.formattedAddress ?? query,
    };
}

export async function autocompleteLocations(
    input: string,
    sessionToken?: string,
): Promise<LocationSuggestion[]> {
    const data = await placesFetch<RawAutocompleteResponse>("/places:autocomplete", {
        fieldMask: [
            "suggestions.placePrediction.placeId",
            "suggestions.placePrediction.text.text",
            "suggestions.placePrediction.structuredFormat",
        ].join(","),
        body: {
            input,
            // Cities, ZIP codes, neighborhoods and other regions.
            includedPrimaryTypes: ["(regions)"],
            includedRegionCodes: ["us"],
            sessionToken,
        },
    });

    return (data.suggestions ?? []).flatMap(({ placePrediction: prediction }) => {
        const mainText = prediction?.structuredFormat?.mainText?.text ?? prediction?.text?.text;
        if (!prediction?.placeId || !mainText) return [];
        return [
            {
                placeId: prediction.placeId,
                mainText,
                secondaryText: prediction.structuredFormat?.secondaryText?.text,
            },
        ];
    });
}

/** Place Details for a picked suggestion; passing the session token closes the autocomplete session. */
export async function getPlaceLocation(
    placeId: string,
    sessionToken?: string,
): Promise<ResolvedLocation | null> {
    const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    const place = await placesFetch<RawPlace>(`/places/${encodeURIComponent(placeId)}${query}`, {
        fieldMask: "location,formattedAddress",
    });
    if (!place.location) return null;
    return {
        center: { lat: place.location.latitude, lng: place.location.longitude },
        label: place.formattedAddress ?? placeId,
    };
}

export async function searchText(params: {
    textQuery: string;
    includedType?: string;
    center: LatLng;
    radiusMeters: number;
}): Promise<RawPlace[]> {
    const data = await placesFetch<{ places?: RawPlace[] }>("/places:searchText", {
        fieldMask: SEARCH_FIELD_MASK,
        body: {
            textQuery: params.textQuery,
            includedType: params.includedType,
            pageSize: PAGE_SIZE,
            regionCode: "us",
            locationBias: {
                circle: {
                    center: { latitude: params.center.lat, longitude: params.center.lng },
                    radius: params.radiusMeters,
                },
            },
        },
    });
    return data.places ?? [];
}

export async function getPlaceSummary(placeId: string): Promise<VenueSummary> {
    const place = await placesFetch<RawSummaryPlace>(`/places/${encodeURIComponent(placeId)}`, {
        fieldMask: SUMMARY_FIELD_MASK,
    });

    const generative = place.generativeSummary?.overview?.text;
    const review = place.reviewSummary?.text?.text;
    return {
        placeId: place.id,
        editorialSummary: place.editorialSummary?.text,
        generativeSummary: generative
            ? { text: generative, disclosure: place.generativeSummary?.disclosureText?.text }
            : undefined,
        reviewSummary: review
            ? { text: review, disclosure: place.reviewSummary?.disclosureText?.text }
            : undefined,
        liveMusic: place.liveMusic,
    };
}
