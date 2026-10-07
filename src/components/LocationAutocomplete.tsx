"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { LocationSuggestion } from "@/lib/venues/types";
import { Icon } from "./Icon";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

type Props = {
    label: string;
    value: string;
    sessionToken: string;
    onChange: (text: string) => void;
    onSelect: (suggestion: LocationSuggestion) => void;
};

export function formatSuggestion(suggestion: LocationSuggestion): string {
    return suggestion.secondaryText
        ? `${suggestion.mainText}, ${suggestion.secondaryText}`
        : suggestion.mainText;
}

export function LocationAutocomplete({ label, value, sessionToken, onChange, onSelect }: Props) {
    const id = useId();
    const listboxId = `${id}-listbox`;
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const inFlight = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            clearTimeout(timer.current);
            inFlight.current?.abort();
        },
        [],
    );

    const requestSuggestions = (input: string) => {
        clearTimeout(timer.current);
        inFlight.current?.abort();
        if (input.trim().length < MIN_CHARS) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        timer.current = setTimeout(async () => {
            const controller = new AbortController();
            inFlight.current = controller;
            try {
                const params = new URLSearchParams({ input: input.trim(), sessionToken });
                const response = await fetch(`/api/locations/autocomplete?${params}`, {
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const body = (await response.json()) as { suggestions: LocationSuggestion[] };
                setSuggestions(body.suggestions);
                setActiveIndex(-1);
                setIsOpen(body.suggestions.length > 0);
            } catch {
                // Aborted or offline: keep free-text entry working.
            }
        }, DEBOUNCE_MS);
    };

    const select = (suggestion: LocationSuggestion) => {
        clearTimeout(timer.current);
        inFlight.current?.abort();
        setIsOpen(false);
        setActiveIndex(-1);
        onSelect(suggestion);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setActiveIndex((i) => (i + 1) % suggestions.length);
                break;
            case "ArrowUp":
                event.preventDefault();
                setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                break;
            case "Enter":
                if (activeIndex >= 0) {
                    event.preventDefault();
                    select(suggestions[activeIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative flex flex-1 flex-col gap-1">
            <div className="relative">
                <Icon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                    id={id}
                    type="text"
                    role="combobox"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-describedby={`${id}-support`}
                    aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        requestSuggestions(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setIsOpen(false)}
                    onFocus={() => setIsOpen(suggestions.length > 0)}
                    // A blank placeholder lets the label float via :placeholder-shown.
                    placeholder=" "
                    maxLength={100}
                    className="peer h-14 w-full rounded-xs border border-outline bg-transparent pr-4 pl-12 type-body-large text-on-surface caret-primary outline-none transition-colors hover:border-on-surface focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--md-primary)]"
                />
                <label
                    htmlFor={id}
                    className="pointer-events-none absolute top-1/2 left-12 -translate-y-1/2 bg-surface-container-low px-1 type-body-large text-on-surface-variant transition-all duration-150 peer-focus:top-0 peer-focus:left-3 peer-focus:type-body-small peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:type-body-small"
                >
                    {label}
                </label>
            </div>
            <p id={`${id}-support`} className="px-4 type-body-small text-on-surface-variant">
                Start typing a city, ZIP code or neighborhood
            </p>
            {isOpen && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label={`${label} suggestions`}
                    className="absolute top-14 z-20 mt-1 w-full overflow-hidden rounded-xs bg-surface-container py-2 shadow-elevation-2"
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.placeId}
                            id={`${id}-option-${index}`}
                            role="option"
                            aria-label={formatSuggestion(suggestion)}
                            aria-selected={index === activeIndex}
                            // Keep focus in the input so blur doesn't close the list before the click lands.
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => select(suggestion)}
                            className={`state-layer flex min-h-14 cursor-pointer items-center gap-4 px-4 py-2 text-on-surface ${index === activeIndex ? "bg-on-surface/10" : ""
                                }`}
                        >
                            <Icon name="location" className="size-6 text-on-surface-variant" />
                            <span className="flex flex-col">
                                <span className="type-body-large">{suggestion.mainText}</span>
                                {suggestion.secondaryText && (
                                    <span className="type-body-medium text-on-surface-variant">
                                        {suggestion.secondaryText}
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                    <li role="presentation" className="px-4 pt-1 text-right type-label-medium text-on-surface-variant">
                        Powered by Google
                    </li>
                </ul>
            )}
        </div>
    );
}
