"use client";

import { useState, type FormEvent } from "react";
import { DEFAULT_CATEGORY_IDS, VENUE_CATEGORIES, type CategoryId } from "@/lib/venues/categories";
import { RADIUS_OPTIONS_MILES, type SearchRequest } from "@/lib/venues/searchSchema";
import type { VenueSize } from "@/lib/venues/size";
import type { Venue } from "@/lib/venues/types";
import { formatSuggestion, LocationAutocomplete } from "./LocationAutocomplete";
import { Icon } from "./Icon";
import { SizeFilter } from "./SizeFilter";

type Props = {
    onSearch: (request: SearchRequest) => void;
    isLoading: boolean;
    /** Size filtering is client-side, so it applies instantly to current results. */
    sizes: readonly VenueSize[];
    onSizesChange: (sizes: VenueSize[]) => void;
    venues: readonly Venue[];
};

export function SearchForm({ onSearch, isLoading, sizes, onSizesChange, venues }: Props) {
    const [location, setLocation] = useState("");
    const [placeId, setPlaceId] = useState<string>();
    const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
    const [radiusMiles, setRadiusMiles] = useState<SearchRequest["radiusMiles"]>(10);
    const [categories, setCategories] = useState<CategoryId[]>(DEFAULT_CATEGORY_IDS);

    const toggleCategory = (id: CategoryId) =>
        setCategories((current) =>
            current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
        );

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        onSearch({
            location: location.trim(),
            radiusMiles,
            categories,
            ...(placeId && { placeId, sessionToken }),
        });
        // A session ends with the place lookup, so the next typeahead starts a new one.
        setSessionToken(crypto.randomUUID());
    };

    const canSubmit = location.trim().length >= 2 && categories.length > 0 && !isLoading;

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-xl bg-surface-container-low p-6 shadow-elevation-1"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <LocationAutocomplete
                    label="City or ZIP code"
                    value={location}
                    sessionToken={sessionToken}
                    onChange={(text) => {
                        setLocation(text);
                        setPlaceId(undefined);
                    }}
                    onSelect={(suggestion) => {
                        setLocation(formatSuggestion(suggestion));
                        setPlaceId(suggestion.placeId);
                    }}
                />
                <fieldset className="flex flex-col gap-1">
                    <legend className="sr-only">Radius</legend>
                    <div className="flex h-14 items-center">
                        <div className="flex h-10 overflow-hidden rounded-full border border-outline">
                            {RADIUS_OPTIONS_MILES.map((miles, index) => (
                                <label
                                    key={miles}
                                    className={`state-layer flex cursor-pointer items-center gap-2 px-4 type-label-large text-on-surface has-checked:bg-secondary-container has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary ${
                                        index > 0 ? "border-l border-outline" : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="radius"
                                        value={miles}
                                        checked={radiusMiles === miles}
                                        onChange={() => setRadiusMiles(miles)}
                                        className="peer sr-only"
                                    />
                                    <Icon name="check" className="hidden size-[18px] peer-checked:block" />
                                    {miles} mi
                                </label>
                            ))}
                        </div>
                    </div>
                    <p className="px-4 type-body-small text-on-surface-variant">Search radius</p>
                </fieldset>
            </div>

            <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 type-title-small text-on-surface-variant">Venue types</legend>
                <div className="flex flex-wrap gap-2">
                    {VENUE_CATEGORIES.map((category) => (
                        <label
                            key={category.id}
                            className="state-layer flex h-8 cursor-pointer items-center gap-2 rounded-sm border border-outline-variant px-4 type-label-large text-on-surface-variant select-none has-checked:border-transparent has-checked:bg-secondary-container has-checked:pl-2 has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
                        >
                            <input
                                type="checkbox"
                                checked={categories.includes(category.id)}
                                onChange={() => toggleCategory(category.id)}
                                className="peer sr-only"
                            />
                            <Icon name="check" className="hidden size-[18px] peer-checked:block" />
                            {category.label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <SizeFilter venues={venues} selected={sizes} onChange={onSizesChange} />

            <button
                type="submit"
                disabled={!canSubmit}
                className="state-layer flex h-10 items-center gap-2 self-start rounded-full bg-primary pr-6 pl-4 type-label-large text-on-primary transition-shadow hover:shadow-elevation-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none"
            >
                {isLoading ? (
                    <span className="size-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                ) : (
                    <Icon name="search" className="size-[18px]" />
                )}
                {isLoading ? "Searching…" : "Find venues"}
            </button>
        </form>
    );
}
