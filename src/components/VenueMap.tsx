"use client";

import { AdvancedMarker, APIProvider, ColorScheme, Map, Pin } from "@vis.gl/react-google-maps";
import type { SearchResponse } from "@/lib/venues/types";

type Props = {
    result: SearchResponse;
    selectedId: string | null;
    onSelect: (placeId: string) => void;
    className?: string;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
export const MAP_ENABLED = Boolean(API_KEY);

const ZOOM_BY_RADIUS: Record<number, number> = { 5: 12, 10: 11, 25: 10 };

export function VenueMap({ result, selectedId, onSelect, className = "h-[400px]" }: Props) {
    if (!API_KEY) return null;

    return (
        <APIProvider apiKey={API_KEY}>
            <Map
                key={`${result.center.lat},${result.center.lng},${result.radiusMiles}`}
                defaultCenter={result.center}
                defaultZoom={ZOOM_BY_RADIUS[result.radiusMiles] ?? 11}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                colorScheme={ColorScheme.FOLLOW_SYSTEM}
                gestureHandling="cooperative"
                disableDefaultUI
                zoomControl
                className={`w-full overflow-hidden rounded-xl ${className}`}
            >
                {result.venues.map((venue) => {
                    const selected = venue.placeId === selectedId;
                    return (
                        <AdvancedMarker
                            key={venue.placeId}
                            position={venue.location}
                            title={venue.name}
                            zIndex={selected ? 1000 : venue.fitScore}
                            onClick={() => onSelect(venue.placeId)}
                        >
                            <Pin
                                background={selected ? "#8b4f25" : "#84746b"}
                                borderColor={selected ? "#6e380f" : "#52443c"}
                                glyphColor={selected ? "#ffdbc8" : "#ffffff"}
                                scale={selected ? 1.3 : 1}
                            />
                        </AdvancedMarker>
                    );
                })}
            </Map>
        </APIProvider>
    );
}
