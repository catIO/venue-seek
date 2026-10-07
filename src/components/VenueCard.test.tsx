import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, makeVenue } from "@/test/fixtures";
import { VenueCard } from "./VenueCard";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

describe("VenueCard", () => {
    it("shows venue details and contact links", () => {
        render(<VenueCard venue={makeVenue()} isSelected={false} onSelect={vi.fn()} />);
        const card = screen.getByRole("article", { name: "Downtown Library" });

        expect(within(card).getByText("Fit 88")).toBeInTheDocument();
        expect(within(card).getByText(/1 Main St/)).toBeInTheDocument();
        expect(within(card).getByText("4.7 (120 reviews)")).toBeInTheDocument();
        expect(within(card).getByRole("link", { name: "(828) 555-0100" })).toHaveAttribute(
            "href",
            "tel:8285550100",
        );
        expect(within(card).getByRole("link", { name: "Website" })).toHaveAttribute(
            "href",
            "https://library.example.org/",
        );
        expect(within(card).getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute(
            "rel",
            "noopener noreferrer",
        );
    });

    it("shows the strongest specific Google performance type", () => {
        const { rerender } = render(
            <VenueCard venue={makeVenue()} isSelected={false} onSelect={vi.fn()} />,
        );
        expect(screen.queryByText(/Google music\/performance tag/)).not.toBeInTheDocument();

        rerender(
            <VenueCard
                venue={makeVenue({
                    hasPerformanceSpace: true,
                    performanceEvidence: {
                        type: "live_music_venue",
                        label: "Live music venue",
                        strength: "direct",
                    },
                })}
                isSelected={false}
                onSelect={vi.fn()}
            />,
        );
        expect(screen.getByText(/Google music\/performance tag/)).toHaveTextContent("Live music venue");
    });

    it("shows the estimated venue size", () => {
        render(<VenueCard venue={makeVenue({ size: "medium" })} isSelected={false} onSelect={vi.fn()} />);
        expect(screen.getByText("Medium venue · est. 150–500")).toBeInTheDocument();
    });

    it("does not render unsafe website links", () => {
        render(
            <VenueCard
                venue={makeVenue({ website: "javascript:alert(1)", phone: undefined })}
                isSelected={false}
                onSelect={vi.fn()}
            />,
        );
        expect(screen.queryByRole("link", { name: "Website" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /555/ })).not.toBeInTheDocument();
    });

    it("calls onSelect with the place id when clicked", async () => {
        const onSelect = vi.fn();
        render(<VenueCard venue={makeVenue()} isSelected={false} onSelect={onSelect} />);

        await userEvent.click(screen.getByRole("heading", { name: "Downtown Library" }));
        expect(onSelect).toHaveBeenCalledWith("ChIJ_test_place_1");
    });

    it("scrolls into view when selected", () => {
        render(<VenueCard venue={makeVenue()} isSelected onSelect={vi.fn()} />);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it("loads Google's structured music signal and general details on demand", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                placeId: "ChIJ_test_place_1",
                reviewSummary: { text: "Hosts a monthly chamber series.", disclosure: "Summarized with Gemini" },
                liveMusic: true,
                performanceEvidence: [
                    { type: "live_music_venue", label: "Live music venue", strength: "direct" },
                ],
            }),
        );
        render(<VenueCard venue={makeVenue()} isSelected={false} onSelect={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "Check Google music signals" }));

        expect(await screen.findByText("Hosts a monthly chamber series.")).toBeInTheDocument();
        expect(screen.getByText("Summarized with Gemini")).toBeInTheDocument();
        expect(screen.getByText("Google reports live music")).toBeInTheDocument();
        expect(screen.getByText("Music signals from Google")).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith("/api/venues/ChIJ_test_place_1/summary");
    });

    it("does not present Google's missing music flag as proof that a venue has no performances", async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ placeId: "ChIJ_test_place_1", liveMusic: false, performanceEvidence: [] }),
        );
        render(<VenueCard venue={makeVenue()} isSelected={false} onSelect={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "Check Google music signals" }));

        expect(
            await screen.findByText(/Google doesn’t flag live music here/),
        ).toHaveTextContent("This does not confirm that performances never happen.");
    });

    it("shows an error and allows retry when the summary fails", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: "Places API request failed (500)" }, 502));
        render(<VenueCard venue={makeVenue()} isSelected={false} onSelect={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "Check Google music signals" }));

        expect(await screen.findByText("Places API request failed (500)")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Check Google music signals" })).toBeInTheDocument();
    });
});
