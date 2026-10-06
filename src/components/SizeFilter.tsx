"use client";

import { VENUE_SIZES, type VenueSize } from "@/lib/venues/size";
import type { Venue } from "@/lib/venues/types";
import { Icon } from "./Icon";

type Props = {
    venues: readonly Venue[];
    selected: readonly VenueSize[];
    onChange: (sizes: VenueSize[]) => void;
};

export function SizeFilter({ venues, selected, onChange }: Props) {
    const toggle = (id: VenueSize) =>
        onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 type-title-small text-on-surface-variant">
                Venue size <span className="type-body-small">(estimated audience)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
                {VENUE_SIZES.map((size) => {
                    const count = venues.filter((v) => v.size === size.id).length;
                    return (
                        <label
                            key={size.id}
                            className="state-layer flex h-8 cursor-pointer items-center gap-2 rounded-sm border border-outline-variant px-4 type-label-large text-on-surface-variant select-none has-checked:border-transparent has-checked:bg-secondary-container has-checked:pl-2 has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(size.id)}
                                onChange={() => toggle(size.id)}
                                className="peer sr-only"
                            />
                            <Icon name="check" className="hidden size-[18px] peer-checked:block" />
                            {`${size.label} (${size.range})`}
                            {venues.length > 0 && (
                                <span aria-hidden="true" className="type-label-medium opacity-80">
                                    {count}
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
