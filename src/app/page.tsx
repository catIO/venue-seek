"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { SearchForm } from "@/components/SearchForm";
import { VenueCard } from "@/components/VenueCard";
import { MAP_ENABLED, VenueMap } from "@/components/VenueMap";
import { VenueMark } from "@/components/VenueMark";
import { useVenueSearch } from "@/hooks/useVenueSearch";
import { DEFAULT_VENUE_SIZES, type VenueSize } from "@/lib/venues/size";

export default function Home() {
  const { state, search } = useVenueSearch();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sizes, setSizes] = useState<VenueSize[]>(DEFAULT_VENUE_SIZES);
  const allVenues = state.status === "success" ? state.data.venues : [];
  const venues = allVenues.filter((v) => sizes.includes(v.size));
  const showMap = MAP_ENABLED && state.status === "success" && venues.length > 0;

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <VenueMark className="size-7" />
            </span>
            <h1 className="type-title-large">Venue Seek</h1>
          </div>
          <h2 className="min-w-0 border-l border-outline-variant pl-4 type-title-medium text-on-surface-variant">
            Find places to perform
          </h2>
        </div>
        {state.status === "loading" && (
          <div role="progressbar" aria-label="Searching venues" className="relative h-1 overflow-hidden bg-primary-container">
            <div className="linear-progress-bar bg-primary" />
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-2 pb-8">
        <SearchForm
          isLoading={state.status === "loading"}
          sizes={sizes}
          onSizesChange={setSizes}
          venues={allVenues}
          onSearch={(request) => {
            setSelectedId(null);
            search(request);
          }}
        />

        {state.status === "error" && (
          <div role="alert" className="flex items-start gap-3 rounded-md bg-error-container p-4 text-on-error-container">
            <Icon name="error" className="size-6" />
            <p className="type-body-medium">{state.error}</p>
          </div>
        )}

        {state.status === "idle" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <Icon name="location" className="size-7" />
            </span>
            <p className="type-title-medium">Search a city to see venues</p>
            <p className="max-w-md type-body-medium text-on-surface-variant">
              Results are ranked by how well they suit an unamplified solo performance.
            </p>
          </div>
        )}

        {state.status === "success" && (
          <section aria-labelledby="results-heading" className="flex flex-col gap-4">
            <div>
              <h2 id="results-heading" className="type-title-large">
                {venues.length === allVenues.length
                  ? `${allVenues.length} venues`
                  : `${venues.length} of ${allVenues.length} venues`}
              </h2>
              <p className="type-body-medium text-on-surface-variant">
                Within {state.data.radiusMiles} miles of {state.data.resolvedLocation}
              </p>
            </div>

            {venues.length === 0 ? (
              <p className="rounded-md bg-surface-container p-4 type-body-medium text-on-surface-variant">
                {allVenues.length === 0
                  ? "No venues found. Try a larger radius or more venue types."
                  : "No venues match the selected sizes."}
              </p>
            ) : (
              <div className={showMap ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}>
                {showMap && (
                  <div className="lg:sticky lg:top-20 lg:order-2 lg:self-start">
                    <VenueMap
                      result={{ ...state.data, venues }}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      className="h-[320px] lg:h-[calc(100vh-7rem)]"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {venues.map((venue) => (
                    <VenueCard
                      key={venue.placeId}
                      venue={venue}
                      isSelected={venue.placeId === selectedId}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 type-body-small text-on-surface-variant">
        Venue data © Google
      </footer>
    </>
  );
}
