import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../Sidebar";

const TOOLTIPS = ["Stroke", "Fill"];

describe("Sidebar", () => {
    test("renders a button for every planned feature", () => {
        const { container } = render(<Sidebar />);

        expect(container.querySelectorAll("[title]")).toHaveLength(
            TOOLTIPS.length
        );
        for (const tooltip of TOOLTIPS) {
            expect(screen.getByTitle(tooltip)).toBeInTheDocument();
        }
    });

    test("renders Fill as a disabled placeholder", () => {
        render(<Sidebar />);

        expect(screen.getByTitle("Fill")).toHaveClass(
            "opacity-50",
            "pointer-events-none"
        );
    });

    test("toggles the stroke panel when clicking the Stroke button", () => {
        render(<Sidebar />);

        expect(screen.queryByLabelText("Stroke width")).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Stroke"));
        expect(screen.getByLabelText("Stroke width")).toBeInTheDocument();
        expect(screen.getByTitle("Stroke")).toHaveClass("bg-gray-500");

        fireEvent.click(screen.getByTitle("Stroke"));
        expect(screen.queryByLabelText("Stroke width")).not.toBeInTheDocument();
    });

    test("closes the stroke panel when clicking outside", () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByTitle("Stroke"));
        expect(screen.getByLabelText("Stroke width")).toBeInTheDocument();

        fireEvent.click(document.querySelector(".fixed.inset-0")!);
        expect(screen.queryByLabelText("Stroke width")).not.toBeInTheDocument();
    });
});
