import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useTool } from "@stores/useToolStore";
import { Tools } from "@/types";

const createMockContext = () => ({
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    setLineDash: jest.fn(),
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    isPointInStroke: jest.fn(() => false),
    isPointInPath: jest.fn(() => false),
});

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

    test("wires the toolbar to the active tool", () => {
        render(<App />);

        expect(screen.getByTitle("Select")).toHaveClass("bg-gray-500");

        fireEvent.click(screen.getByTitle("Arrow"));

        expect(useTool.getState().tool).toEqual(Tools.arrow);
        expect(useCanvasStore.getState().selectedIds).toEqual([]);
    });
});
