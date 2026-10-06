import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeVenue } from "@/test/fixtures";
import { SizeFilter } from "./SizeFilter";

const venues = [
    makeVenue({ placeId: "a", size: "intimate" }),
    makeVenue({ placeId: "b", size: "intimate" }),
    makeVenue({ placeId: "c", size: "large" }),
];

describe("SizeFilter", () => {
    it("renders a chip per size with checked state and counts", () => {
        render(<SizeFilter venues={venues} selected={["intimate", "small"]} onChange={vi.fn()} />);

        expect(screen.getByRole("checkbox", { name: "Intimate (under 50)" })).toBeChecked();
        expect(screen.getByRole("checkbox", { name: "Small (50–150)" })).toBeChecked();
        expect(screen.getByRole("checkbox", { name: "Large (500+)" })).not.toBeChecked();
        expect(screen.getByRole("checkbox", { name: "Intimate (under 50)" }).closest("label")).toHaveTextContent("2");
    });

    it("adds and removes sizes", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SizeFilter venues={venues} selected={["intimate"]} onChange={onChange} />);

        await user.click(screen.getByRole("checkbox", { name: "Large (500+)" }));
        expect(onChange).toHaveBeenLastCalledWith(["intimate", "large"]);

        await user.click(screen.getByRole("checkbox", { name: "Intimate (under 50)" }));
        expect(onChange).toHaveBeenLastCalledWith([]);
    });
});
