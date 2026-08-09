import { render, screen, fireEvent } from "@testing-library/react";
import ToolBar from "../ToolBar";
import { Tools, useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";

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

    test("renders a button for every tool", () => {
        const { container } = render(<ToolBar />);

        expect(container.querySelectorAll("[title]")).toHaveLength(
            TOOLTIPS.length
        );
        for (const tooltip of TOOLTIPS) {
            expect(screen.getByTitle(tooltip)).toBeInTheDocument();
        }
    });

    test("clicking a tool updates the active tool", () => {
        render(<ToolBar />);

        fireEvent.click(screen.getByTitle("Rectangle"));

        expect(useTool.getState().tool).toEqual(Tools.rect);
    });

    test("marks the active tool button", () => {
        useTool.getState().setTool(Tools.pan);
        render(<ToolBar />);

        expect(screen.getByTitle("Pan")).toHaveClass("bg-gray-500");
        expect(screen.getByTitle("Select")).toHaveClass("bg-gray-300");
    });

    test("disables buttons while dragging", () => {
        useCanvasStore.getState().setIsDragging(true);
        render(<ToolBar />);

        for (const tooltip of TOOLTIPS) {
            expect(screen.getByTitle(tooltip)).toHaveClass(
                "opacity-50",
                "pointer-events-none"
            );
        }
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
