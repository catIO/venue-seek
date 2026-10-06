import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CATEGORY_IDS } from "@/lib/venues/categories";
import { DEFAULT_VENUE_SIZES } from "@/lib/venues/size";
import { jsonResponse, makeVenue } from "@/test/fixtures";
import { SearchForm as BaseSearchForm } from "./SearchForm";

type FormProps = ComponentProps<typeof BaseSearchForm>;

function SearchForm(props: Pick<FormProps, "onSearch" | "isLoading"> & Partial<FormProps>) {
    return <BaseSearchForm sizes={DEFAULT_VENUE_SIZES} onSizesChange={vi.fn()} venues={[]} {...props} />;
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => jsonResponse({ suggestions: [] }));
    vi.stubGlobal("fetch", fetchMock);
});

describe("SearchForm", () => {
    it("shows the venue size filter before any search and reports changes", async () => {
        const user = userEvent.setup();
        const onSizesChange = vi.fn();
        render(<SearchForm onSearch={vi.fn()} isLoading={false} onSizesChange={onSizesChange} />);

        expect(screen.getByRole("checkbox", { name: "Large (500+)" })).not.toBeChecked();
        await user.click(screen.getByRole("checkbox", { name: "Large (500+)" }));
        expect(onSizesChange).toHaveBeenCalledWith([...DEFAULT_VENUE_SIZES, "large"]);
    });

    it("shows per-size counts once there are results", () => {
        render(
            <SearchForm
                onSearch={vi.fn()}
                isLoading={false}
                venues={[makeVenue({ placeId: "a", size: "large" }), makeVenue({ placeId: "b", size: "large" })]}
            />,
        );
        expect(screen.getByRole("checkbox", { name: "Large (500+)" }).closest("label")).toHaveTextContent("2");
    });

    it("submits the selected suggestion's place id and session token", async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        fetchMock.mockImplementation(async () =>
            jsonResponse({
                suggestions: [
                    { placeId: "ChIJCW8PPKmMWYgRXTo0BsEx75Q", mainText: "Asheville", secondaryText: "NC, USA" },
                ],
            }),
        );
        render(<SearchForm onSearch={onSearch} isLoading={false} />);

        await user.type(screen.getByLabelText("City or ZIP code"), "Ashe");
        await user.click(await screen.findByRole("option", { name: "Asheville, NC, USA" }));
        await user.click(screen.getByRole("button", { name: "Find venues" }));

        expect(screen.getByLabelText("City or ZIP code")).toHaveValue("Asheville, NC, USA");
        expect(onSearch).toHaveBeenCalledTimes(1);
        const request = onSearch.mock.calls[0][0];
        expect(request).toMatchObject({
            location: "Asheville, NC, USA",
            placeId: "ChIJCW8PPKmMWYgRXTo0BsEx75Q",
        });
        const autocompleteUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
        expect(request.sessionToken).toBe(autocompleteUrl.searchParams.get("sessionToken"));
    });

    it("drops the selected place when the location is edited", async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        fetchMock.mockImplementation(async () =>
            jsonResponse({
                suggestions: [{ placeId: "ChIJCW8PPKmMWYgRXTo0BsEx75Q", mainText: "Asheville" }],
            }),
        );
        render(<SearchForm onSearch={onSearch} isLoading={false} />);

        const input = screen.getByLabelText("City or ZIP code");
        await user.type(input, "Ashe");
        await user.click(await screen.findByRole("option", { name: "Asheville" }));
        await user.type(input, " area");
        await user.click(screen.getByRole("button", { name: "Find venues" }));

        expect(onSearch.mock.calls[0][0]).not.toHaveProperty("placeId");
        expect(onSearch.mock.calls[0][0]).not.toHaveProperty("sessionToken");
    });

    it("submits the trimmed location, radius and selected categories", async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        render(<SearchForm onSearch={onSearch} isLoading={false} />);

        await user.type(screen.getByLabelText("City or ZIP code"), "  Asheville, NC ");
        await user.click(screen.getByRole("radio", { name: "25 mi" }));
        await user.click(screen.getByRole("checkbox", { name: "Cafés" }));
        await user.click(screen.getByRole("checkbox", { name: "Libraries" }));
        await user.click(screen.getByRole("button", { name: "Find venues" }));

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith({
            location: "Asheville, NC",
            radiusMiles: 25,
            categories: [...DEFAULT_CATEGORY_IDS.filter((id) => id !== "library"), "cafe"],
        });
    });

    it("disables search until a location is entered", async () => {
        const user = userEvent.setup();
        render(<SearchForm onSearch={vi.fn()} isLoading={false} />);

        const button = screen.getByRole("button", { name: "Find venues" });
        expect(button).toBeDisabled();
        await user.type(screen.getByLabelText("City or ZIP code"), "28801");
        expect(button).toBeEnabled();
    });

    it("disables search when no venue types are selected", async () => {
        const user = userEvent.setup();
        render(<SearchForm onSearch={vi.fn()} isLoading={false} />);

        await user.type(screen.getByLabelText("City or ZIP code"), "28801");
        for (const checkbox of screen.getAllByRole("checkbox", { checked: true })) {
            await user.click(checkbox);
        }
        expect(screen.getByRole("button", { name: "Find venues" })).toBeDisabled();
    });

    it("shows a loading state", () => {
        render(<SearchForm onSearch={vi.fn()} isLoading />);
        expect(screen.getByRole("button", { name: "Searching…" })).toBeDisabled();
    });
});
