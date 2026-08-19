import { render, screen, fireEvent } from "@testing-library/react";
import ToolBar from "../ToolBar";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools } from "@/types";

const TOOLTIPS = [
    "Pan",
    "Select",
    "Rectangle",
    "Diamond",
    "Ellipse",
    "Arrow",
    "Line",
];

describe("ToolBar", () => {
    beforeEach(() => {
        useTool.getState().setTool(Tools.select);
        useCanvasStore.getState().reset();
    });

    test("renders one button per tool", () => {
        const { container } = render(<ToolBar />);

        expect(container.querySelectorAll("[title]")).toHaveLength(
            TOOLTIPS.length
        );
    });

    test.each(TOOLTIPS)("renders a button for the %s tool", tooltip => {
        render(<ToolBar />);

        expect(screen.getByTitle(tooltip)).toBeInTheDocument();
    });

    test("clicking a tool updates the active tool", () => {
        render(<ToolBar />);

        fireEvent.click(screen.getByTitle("Rectangle"));

        expect(useTool.getState().tool).toEqual(Tools.rect);
    });

    test("applies the active class to the current tool button", () => {
        useTool.getState().setTool(Tools.pan);
        render(<ToolBar />);

        expect(screen.getByTitle("Pan")).toHaveClass("bg-gray-500");
    });

    test("does not apply the active class to the other tool buttons", () => {
        useTool.getState().setTool(Tools.pan);
        render(<ToolBar />);

        expect(screen.getByTitle("Select")).toHaveClass("bg-gray-300");
    });

    test.each(TOOLTIPS)("disables the %s button while dragging", tooltip => {
        useCanvasStore.getState().setIsDragging(true);
        render(<ToolBar />);

        expect(screen.getByTitle(tooltip)).toHaveClass(
            "opacity-50",
            "pointer-events-none"
        );
    });

    test("does not switch tools while disabled", () => {
        useCanvasStore.getState().setIsBoxSelecting(true);
        render(<ToolBar />);

        fireEvent.click(screen.getByTitle("Pan"));

        expect(useTool.getState().tool).toEqual(Tools.select);
    });

    test("disables buttons while panning", () => {
        useCanvasStore.getState().setIsPanning(true);
        render(<ToolBar />);

        expect(screen.getByTitle("Rectangle")).toHaveClass("opacity-50");
    });
});
