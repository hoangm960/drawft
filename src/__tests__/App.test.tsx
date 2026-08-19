import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useTool } from "@stores/useToolStore";
import { Tools } from "@/types";
import { createMockContext } from "@/test/factories";

describe("App", () => {
    beforeEach(() => {
        useTool.getState().setTool(Tools.select);
        useCanvasStore.getState().reset();
        jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            createMockContext() as unknown as CanvasRenderingContext2D
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("renders the canvas and the toolbar", () => {
        render(<App />);

        expect(document.getElementById("whiteboard")).toBeInTheDocument();
        expect(screen.getByTitle("Rectangle")).toBeInTheDocument();
        expect(screen.getByTitle("Select")).toBeInTheDocument();
    });

    test("highlights the active tool button", () => {
        render(<App />);

        expect(screen.getByTitle("Select")).toHaveClass("bg-gray-500");
    });

    test("updates the active tool when clicking a tool button", () => {
        render(<App />);

        fireEvent.click(screen.getByTitle("Arrow"));

        expect(useTool.getState().tool).toEqual(Tools.arrow);
    });

    test("clears the selection when switching tools", () => {
        render(<App />);

        fireEvent.click(screen.getByTitle("Arrow"));

        expect(useCanvasStore.getState().selectedIds).toEqual([]);
    });
});
