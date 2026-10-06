"use client";

import { useCallback, useRef, useState } from "react";
import type { SearchRequest } from "@/lib/venues/searchSchema";
import type { SearchResponse } from "@/lib/venues/types";

export type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: SearchResponse }
    | { status: "error"; error: string };

export function useVenueSearch() {
    const [state, setState] = useState<SearchState>({ status: "idle" });
    const inFlight = useRef<AbortController | null>(null);

    const search = useCallback(async (request: SearchRequest) => {
        inFlight.current?.abort();
        const controller = new AbortController();
        inFlight.current = controller;
        setState({ status: "loading" });

        try {
            const response = await fetch("/api/venues/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            const body = await response.json();
            if (!response.ok) {
                setState({ status: "error", error: body.error ?? "Search failed" });
                return;
            }
            setState({ status: "success", data: body as SearchResponse });
        } catch {
            if (controller.signal.aborted) return;
            setState({ status: "error", error: "Network error. Please try again." });
        }
    }, []);

    return { state, search };
}
