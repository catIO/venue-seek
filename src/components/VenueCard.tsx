"use client";

import { useEffect, useRef } from "react";
import { getCategory } from "@/lib/venues/categories";
import { getVenueSize } from "@/lib/venues/size";
import type { Venue } from "@/lib/venues/types";
import { safeExternalUrl } from "@/lib/venues/url";
import { Icon } from "./Icon";
import { VenueSummaryPanel } from "./VenueSummaryPanel";

type Props = {
    venue: Venue;
    isSelected: boolean;
    onSelect: (placeId: string) => void;
};

function scoreClasses(score: number): string {
    if (score >= 75) return "bg-primary-container text-on-primary-container";
    if (score >= 50) return "bg-secondary-container text-on-secondary-container";
    return "bg-surface-container-highest text-on-surface-variant";
}

const assistChip =
    "state-layer inline-flex h-8 items-center gap-2 rounded-sm border border-outline-variant pr-4 pl-2 type-label-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function VenueCard({ venue, isSelected, onSelect }: Props) {
    const ref = useRef<HTMLElement>(null);
    const website = safeExternalUrl(venue.website);
    const mapsLink = safeExternalUrl(venue.googleMapsUri);

    useEffect(() => {
        if (isSelected) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [isSelected]);

    return (
        <article
            ref={ref}
            aria-label={venue.name}
            onClick={() => onSelect(venue.placeId)}
            className={`flex cursor-pointer flex-col gap-3 rounded-md p-4 transition-shadow ${
                isSelected
                    ? "bg-surface-container-high shadow-elevation-2 outline-2 outline-primary"
                    : "bg-surface-container-low shadow-elevation-1 hover:shadow-elevation-2"
            }`}
        >
            <header className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="type-title-medium text-on-surface">{venue.name}</h3>
                    <p className="type-body-medium text-on-surface-variant">
                        {venue.categories.map((id) => getCategory(id).label).join(" · ")}
                        {venue.typeLabel && ` — ${venue.typeLabel}`}
                    </p>
                </div>
                <span
                    title="Fit score for solo classical guitar"
                    className={`flex h-8 shrink-0 items-center rounded-sm px-3 type-label-large ${scoreClasses(venue.fitScore)}`}
                >
                    Fit {venue.fitScore}
                </span>
            </header>

            <div className="flex flex-col gap-1 type-body-medium text-on-surface-variant">
                <p className="flex items-start gap-2">
                    <Icon name="location" className="mt-0.5 size-4" />
                    <span>
                        {venue.address} · {venue.distanceMiles} mi
                    </span>
                </p>
                {venue.rating !== undefined && (
                    <p className="flex items-center gap-2">
                        <Icon name="star" className="size-4 text-primary" />
                        <span>
                            {venue.rating.toFixed(1)} ({venue.ratingCount ?? 0} reviews)
                        </span>
                    </p>
                )}
                <p className="flex items-center gap-2" title="Estimated from venue type; Google doesn't publish capacity">
                    <Icon name="people" className="size-4" />
                    <span>
                        {getVenueSize(venue.size).label} venue · est. {getVenueSize(venue.size).range}
                    </span>
                </p>
            </div>

            {venue.hasPerformanceSpace && (
                <span className="inline-flex h-8 items-center gap-2 self-start rounded-sm bg-tertiary-container pr-4 pl-2 type-label-large text-on-tertiary-container">
                    <Icon name="music" className="size-[18px]" />
                    Performance space
                </span>
            )}

            <ul className="flex flex-wrap gap-2">
                {venue.phone && (
                    <li>
                        <a href={`tel:${venue.phone.replace(/[^\d+]/g, "")}`} className={assistChip}>
                            <Icon name="call" className="size-[18px] text-primary" />
                            {venue.phone}
                        </a>
                    </li>
                )}
                {website && (
                    <li>
                        <a href={website} target="_blank" rel="noopener noreferrer" className={assistChip}>
                            <Icon name="language" className="size-[18px] text-primary" />
                            Website
                        </a>
                    </li>
                )}
                {mapsLink && (
                    <li>
                        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className={assistChip}>
                            <Icon name="openInNew" className="size-[18px] text-primary" />
                            Open in Google Maps
                        </a>
                    </li>
                )}
            </ul>

            {venue.openingHours && venue.openingHours.length > 0 && (
                <details className="group type-body-medium">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-on-surface-variant [&::-webkit-details-marker]:hidden">
                        <Icon name="schedule" className="size-4" />
                        Hours
                        <Icon name="expandMore" className="size-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mt-2 flex flex-col gap-0.5 pl-6 text-on-surface-variant">
                        {venue.openingHours.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </details>
            )}

            <VenueSummaryPanel placeId={venue.placeId} />
        </article>
    );
}
