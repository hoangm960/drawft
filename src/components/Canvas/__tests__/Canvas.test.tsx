import { render, fireEvent, act } from "@testing-library/react";
import Canvas from "../Canvas";
import { Tools, useTool } from "../../../stores/useToolStore";
import { useCanvasStore } from "../../../stores/useCanvasStore";
import type { Point, Shape } from "../../../types";

const canvas = () => document.getElementById("whiteboard") as HTMLElement;

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect
): Shape => ({ id, type, from, to });

type MockHit = { inStroke: boolean; inPath: boolean };

const createMockContext = (hit: MockHit) => ({
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    setLineDash: jest.fn(),
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    isPointInStroke: jest.fn(() => hit.inStroke),
    isPointInPath: jest.fn(() => hit.inPath),
});

describe("Canvas", () => {
    let hit: MockHit;

    beforeEach(() => {
        hit = { inStroke: false, inPath: false };
        useTool.getState().setTool(Tools.select);
        useCanvasStore.getState().reset();
        jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            createMockContext(hit) as unknown as CanvasRenderingContext2D
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("renders a canvas with the whiteboard id", () => {
        render(<Canvas />);

        expect(canvas()).toBeInTheDocument();
        expect(canvas().tagName).toEqual("CANVAS");
    });

    test("applies the cursor class for the active tool", () => {
        useTool.getState().setTool(Tools.pan);
        const { unmount } = render(<Canvas />);
        expect(canvas()).toHaveClass("cursor-grab");
        unmount();

        useTool.getState().setTool(Tools.select);
        render(<Canvas />);
        expect(canvas()).not.toHaveClass(/cursor-/);
    });

    test("uses the crosshair cursor for drawing tools", () => {
        useTool.getState().setTool(Tools.rect);
        render(<Canvas />);

        expect(canvas()).toHaveClass("cursor-crosshair");
    });

    test("zooms in and out with the wheel", () => {
        render(<Canvas />);

        fireEvent.wheel(canvas(), { deltaY: -100 });
        expect(useCanvasStore.getState().scale).toBeCloseTo(1.1);

        fireEvent.wheel(canvas(), { deltaY: 100 });
        expect(useCanvasStore.getState().scale).toBeCloseTo(1.0);
    });

    test("clamps the zoom to the allowed range", () => {
        useCanvasStore.getState().setScale(0.1);
        render(<Canvas />);

        fireEvent.wheel(canvas(), { deltaY: 100000 });
        expect(useCanvasStore.getState().scale).toEqual(0.1);

        act(() => {
            useCanvasStore.getState().setScale(5);
        });
        fireEvent.wheel(canvas(), { deltaY: -100000 });
        expect(useCanvasStore.getState().scale).toEqual(5);
    });

    test("draws a shape from drag and commits it on mouse up", () => {
        useTool.getState().setTool(Tools.rect);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 300 });
        fireEvent.mouseUp(canvas());

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(1);
        expect(state.shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("pans the canvas with the pan tool", () => {
        useTool.getState().setTool(Tools.pan);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 150, clientY: 175 });

        expect(useCanvasStore.getState().offset).toEqual({ x: 50, y: 75 });
    });

    test("box-selects shapes drawn through the selection area", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore
            .getState()
            .addShape(makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 }));
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(canvas());

        expect(new Set(useCanvasStore.getState().selectedIds)).toEqual(
            new Set([0, 1])
        );
    });

    test("selects a shape when clicked on it", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });

        expect(useCanvasStore.getState().selectedIds).toEqual([0]);
    });

    test("deletes the selected shape with the Delete key", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Delete" });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(0);
        expect(state.selectedIds).toEqual([]);
    });

    test("deletes the selected shape with the Backspace key", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Backspace" });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });
});
