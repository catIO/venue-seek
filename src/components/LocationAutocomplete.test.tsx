import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocationSuggestion } from "@/lib/venues/types";
import { jsonResponse } from "@/test/fixtures";
import { formatSuggestion, LocationAutocomplete } from "./LocationAutocomplete";

const TOKEN = "6f1c2a52-3c1e-4d7a-9a51-0e2b8c4f9d10";
const SUGGESTIONS: LocationSuggestion[] = [
    { placeId: "ChIJasheville", mainText: "Asheville", secondaryText: "NC, USA" },
    { placeId: "ChIJashland", mainText: "Ashland", secondaryText: "OR, USA" },
];

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => jsonResponse({ suggestions: SUGGESTIONS }));
    vi.stubGlobal("fetch", fetchMock);
});

function Harness({ onSelect = vi.fn() }: { onSelect?: (s: LocationSuggestion) => void }) {
    const [value, setValue] = useState("");
    return (
        <LocationAutocomplete
            label="City or ZIP code"
            value={value}
            sessionToken={TOKEN}
            onChange={setValue}
            onSelect={(s) => {
                setValue(formatSuggestion(s));
                onSelect(s);
            }}
        />
    );
}

describe("LocationAutocomplete", () => {
    it("fetches debounced suggestions with the session token", async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.type(screen.getByRole("combobox", { name: "City or ZIP code" }), "Ashe");

        expect(await screen.findByRole("option", { name: "Asheville, NC, USA" })).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
        expect(url.pathname).toBe("/api/locations/autocomplete");
        expect(url.searchParams.get("input")).toBe("Ashe");
        expect(url.searchParams.get("sessionToken")).toBe(TOKEN);
        expect(screen.getByText("Powered by Google")).toBeInTheDocument();
    });

    it("does not fetch for fewer than two characters", async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.type(screen.getByRole("combobox"), "A");
        await new Promise((resolve) => setTimeout(resolve, 300));

        expect(fetchMock).not.toHaveBeenCalled();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("selects a suggestion by click", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Harness onSelect={onSelect} />);

        const input = screen.getByRole("combobox");
        await user.type(input, "Ashe");
        await user.click(await screen.findByRole("option", { name: "Ashland, OR, USA" }));

        expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1]);
        expect(input).toHaveValue("Ashland, OR, USA");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("supports keyboard navigation and selection", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Harness onSelect={onSelect} />);

        const input = screen.getByRole("combobox");
        await user.type(input, "Ashe");
        await screen.findByRole("listbox");

        await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");
        expect(screen.getByRole("option", { name: "Asheville, NC, USA" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        expect(input).toHaveAttribute("aria-activedescendant");

        await user.keyboard("{Enter}");
        expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[0]);
        expect(input).toHaveValue("Asheville, NC, USA");
    });

    it("closes the list on Escape", async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.type(screen.getByRole("combobox"), "Ashe");
        await screen.findByRole("listbox");
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
    });

    it("keeps free-text entry working when suggestions fail", async () => {
        const user = userEvent.setup();
        fetchMock.mockImplementation(async () => jsonResponse({ error: "boom" }, 500));
        render(<Harness />);

        const input = screen.getByRole("combobox");
        await user.type(input, "28801");
        await new Promise((resolve) => setTimeout(resolve, 300));

        expect(fetchMock).toHaveBeenCalled();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(input).toHaveValue("28801");
    });
});
