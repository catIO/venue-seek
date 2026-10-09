"use client";

import { useState } from "react";
import type { AiSummary, VenueSummary } from "@/lib/venues/types";
import { Icon } from "./Icon";

type SummaryState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; summary: VenueSummary }
    | { status: "error"; error: string };

function evidenceClasses(strength: string): string {
    if (strength === "direct") return "bg-tertiary-container text-on-tertiary-container";
    if (strength === "strong") return "bg-secondary-container text-on-secondary-container";
    return "bg-surface-container-highest text-on-surface-variant";
}

export function VenueSummaryPanel({ placeId }: { placeId: string }) {
    const [state, setState] = useState<SummaryState>({ status: "idle" });

    const load = async () => {
        setState({ status: "loading" });
        try {
            const response = await fetch(`/api/venues/${encodeURIComponent(placeId)}/summary`);
            const body = await response.json();
            if (!response.ok) {
                setState({ status: "error", error: body.error ?? "Couldn't load summary" });
                return;
            }
            setState({ status: "loaded", summary: body as VenueSummary });
        } catch {
            setState({ status: "error", error: "Network error. Please try again." });
        }
    };

    if (state.status === "idle" || state.status === "error") {
        return (
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={load}
                    className="state-layer -ml-3 flex h-10 items-center gap-2 self-start rounded-full px-3 type-label-large text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                    <Icon name="sparkle" className="size-[18px]" />
                    Check Google music signals
                </button>
                {state.status === "error" && (
                    <p className="flex items-center gap-2 type-body-small text-error">
                        <Icon name="error" className="size-4" />
                        {state.error}
                    </p>
                )}
            </div>
        );
    }

    if (state.status === "loading") {
        return (
            <p className="flex h-10 items-center gap-2 type-body-medium text-on-surface-variant">
                <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                Checking Google music signals…
            </p>
        );
    }

    const { editorialSummary, generativeSummary, reviewSummary, liveMusic, performanceEvidence } = state.summary;

    return (
        <div className="flex flex-col gap-3 rounded-md bg-surface-container-highest p-4 type-body-medium text-on-surface">
            <section className="flex flex-col gap-2" aria-label="Music signals from Google">
                <p className="type-title-small">Music signals from Google</p>
                {liveMusic === true && (
                    <span className="inline-flex h-8 items-center gap-2 self-start rounded-sm bg-tertiary-container pr-4 pl-2 type-label-large text-on-tertiary-container">
                        <Icon name="music" className="size-[18px]" />
                        Live music
                    </span>
                )}
                {liveMusic === false && (
                    <p className="text-on-surface-variant">
                        Google doesn’t flag live music here. This does not confirm that performances never happen.
                    </p>
                )}
                {liveMusic === undefined && performanceEvidence.length === 0 && (
                    <p className="text-on-surface-variant">Google returned no music or performance-space tags.</p>
                )}
                <ul className="flex flex-wrap gap-2">
                    {performanceEvidence.map((evidence) => (
                        <li
                            key={evidence.type}
                            className={`rounded-sm px-3 py-1 type-label-large ${evidenceClasses(evidence.strength)}`}
                        >
                            {evidence.label}
                        </li>
                    ))}
                </ul>
            </section>
            {(editorialSummary || generativeSummary || reviewSummary) && (
                <section className="flex flex-col gap-2 border-t border-outline-variant pt-3">
                    <p className="type-title-small">General Google information</p>
                    {editorialSummary && <p>{editorialSummary}</p>}
                    {generativeSummary && <AiSummaryBlock title="Overview" summary={generativeSummary} />}
                    {reviewSummary && <AiSummaryBlock title="What reviewers say" summary={reviewSummary} />}
                </section>
            )}
        </div>
    );
}

function AiSummaryBlock({ title, summary }: { title: string; summary: AiSummary }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="type-title-small">{title}</p>
            <p>{summary.text}</p>
            {summary.disclosure && (
                <p className="flex items-center gap-1 type-body-small text-on-surface-variant">
                    <Icon name="sparkle" className="size-3.5" />
                    {summary.disclosure}
                </p>
            )}
        </div>
    );
}
