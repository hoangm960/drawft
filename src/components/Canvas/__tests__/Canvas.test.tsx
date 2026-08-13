import { render, fireEvent, act } from "@testing-library/react";
import Canvas from "../Canvas";
import { Tools, useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import type { Point, Shape } from "@/types";

const canvas = () => document.getElementById("whiteboard") as HTMLElement;

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect
): Shape => ({ id, type, from, to, rotation: 0 });

type MockHit = { inStroke: boolean; inPath: boolean };

const createMockContext = (hit: MockHit) => ({
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
            rotation: 0,
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

    test("resizes a selected shape by dragging a corner handle", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 0, y: 0 },
            to: { x: 150, y: 150 },
            rotation: 0,
        });
    });

    test("mirrors the shape when dragging a handle past the opposite edge", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: -50, clientY: -50 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 0, y: 0 },
            to: { x: -50, y: -50 },
            rotation: 0,
        });
    });

    test("keeps the dragged corner glued across multiple flips", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: -50, clientY: -50 });
        fireEvent.mouseMove(canvas(), { clientX: 80, clientY: 80 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 0, y: 0 },
            to: { x: 80, y: 80 },
            rotation: 0,
        });
    });

    test("resizes an arrow from its to endpoint handle", () => {
        useCanvasStore
            .getState()
            .addShape(
                makeShape(0, { x: 0, y: 0 }, { x: 100, y: 0 }, Tools.arrow)
            );
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 0 });
        fireEvent.mouseMove(canvas(), { clientX: 150, clientY: 0 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.arrow,
            from: { x: 0, y: 0 },
            to: { x: 150, y: 0 },
            rotation: 0,
        });
    });

    test("resizes multiple selected shapes as a group", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore
            .getState()
            .addShape(makeShape(1, { x: 150, y: 150 }, { x: 200, y: 200 }));
        useCanvasStore.getState().setSelectedIds([0, 1]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(canvas(), { clientX: 300, clientY: 300 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 0, y: 0 },
            to: { x: 150, y: 150 },
            rotation: 0,
        });
        expect(useCanvasStore.getState().shapes.get(1)).toEqual({
            id: 1,
            type: Tools.rect,
            from: { x: 225, y: 225 },
            to: { x: 300, y: 300 },
            rotation: 0,
        });
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

    test.each([[Tools.dia], [Tools.ellipse], [Tools.arrow], [Tools.line]])(
        "commits a %s shape from drag",
        type => {
            useTool.getState().setTool(type as Tools);
            render(<Canvas />);

            fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
            fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 300 });
            fireEvent.mouseUp(canvas());

            const state = useCanvasStore.getState();
            expect(state.shapes.size).toEqual(1);
            expect(state.shapes.get(0)?.type).toEqual(type as Tools);
            expect(state.shapes.get(0)?.rotation).toEqual(0);
        }
    );

    test("pans with the middle mouse button in select mode", () => {
        useTool.getState().setTool(Tools.select);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), {
            clientX: 100,
            clientY: 100,
            button: 1,
        });
        fireEvent.mouseMove(canvas(), { clientX: 150, clientY: 175 });

        expect(useCanvasStore.getState().offset).toEqual({ x: 50, y: 75 });
    });

    test("shift+click toggles a selected shape in and out of the selection", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore
            .getState()
            .addShape(makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 }));
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        expect(useCanvasStore.getState().selectedIds).toEqual([1]);

        fireEvent.mouseDown(canvas(), {
            clientX: 50,
            clientY: 50,
            shiftKey: true,
        });
        expect(useCanvasStore.getState().selectedIds).toEqual([]);

        fireEvent.mouseDown(canvas(), {
            clientX: 50,
            clientY: 50,
            shiftKey: true,
        });
        expect(useCanvasStore.getState().selectedIds).toEqual([1]);
    });

    test("moves a selected shape by dragging it", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(canvas(), { clientX: 70, clientY: 80 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)).toEqual({
            id: 0,
            type: Tools.rect,
            from: { x: 20, y: 30 },
            to: { x: 120, y: 130 },
            rotation: 0,
        });
    });

    test("clears the selection when clicking empty space without shift", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        hit.inStroke = false;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 400, clientY: 400 });

        expect(useCanvasStore.getState().selectedIds).toEqual([]);
        expect(useCanvasStore.getState().isBoxSelecting).toBe(true);
    });

    test("keeps the selection when shift+clicking empty space", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        hit.inStroke = false;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), {
            clientX: 400,
            clientY: 400,
            shiftKey: true,
        });

        expect(useCanvasStore.getState().selectedIds).toEqual([0]);
        expect(useCanvasStore.getState().isBoxSelecting).toBe(false);
    });

    test("shows a grab cursor when hovering the rotate handle", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseMove(canvas(), { clientX: 50, clientY: -50 });
        expect(canvas()).toHaveClass("cursor-grab");

        fireEvent.mouseLeave(canvas());
        expect(canvas()).not.toHaveClass(/cursor-/);
    });

    test("shows a resize cursor when hovering a corner handle", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseMove(canvas(), { clientX: 100, clientY: 100 });
        expect(canvas()).toHaveClass("cursor-nwse-resize");
    });

    test("rotates a selected shape by dragging the rotate handle", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: -50 });
        fireEvent.mouseMove(canvas(), { clientX: 100, clientY: 50 });
        fireEvent.mouseUp(canvas());

        const shape = useCanvasStore.getState().shapes.get(0)!;
        expect(shape.rotation).toBeCloseTo(Math.PI / 2);
        expect(shape.from).toEqual({ x: 0, y: 0 });
        expect(shape.to).toEqual({ x: 100, y: 100 });
    });

    test("box-selects shapes when dragging outside the canvas", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore
            .getState()
            .addShape(makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 }));
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(window);

        expect(new Set(useCanvasStore.getState().selectedIds)).toEqual(
            new Set([0, 1])
        );
    });

    test("does nothing when pressing Delete with no selection", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Delete" });

        expect(useCanvasStore.getState().shapes.size).toEqual(1);
    });

    test("copies the selected shapes with Ctrl+C", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "c", ctrlKey: true });

        expect(useCanvasStore.getState().clipboard).toEqual([
            {
                id: 0,
                type: Tools.rect,
                from: { x: 0, y: 0 },
                to: { x: 100, y: 100 },
                rotation: 0,
            },
        ]);
    });

    test("pastes the clipboard with Ctrl+V and selects the pasted shape", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);
        fireEvent.keyDown(window, { key: "c", ctrlKey: true });

        fireEvent.keyDown(window, { key: "v", ctrlKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(2);
        expect(state.shapes.get(1)).toEqual({
            id: 1,
            type: Tools.rect,
            from: { x: 10, y: 10 },
            to: { x: 110, y: 110 },
            rotation: 0,
        });
        expect(state.selectedIds).toEqual([1]);
    });

    test("duplicates the selected shape with Ctrl+D", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "d", ctrlKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(2);
        expect(state.shapes.get(1)).toEqual({
            id: 1,
            type: Tools.rect,
            from: { x: 10, y: 10 },
            to: { x: 110, y: 110 },
            rotation: 0,
        });
        expect(state.selectedIds).toEqual([1]);
    });

    test("treats Cmd shortcuts like Ctrl shortcuts", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "c", metaKey: true });
        fireEvent.keyDown(window, { key: "v", metaKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(2);
        expect(state.shapes.get(1)?.from).toEqual({ x: 10, y: 10 });
        expect(state.selectedIds).toEqual([1]);
    });

    test("does nothing on copy with no selection", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "c", ctrlKey: true });

        expect(useCanvasStore.getState().clipboard).toEqual([]);
    });

    test("does nothing on paste with an empty clipboard", () => {
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "v", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("does nothing on duplicate with no selection", () => {
        useCanvasStore
            .getState()
            .addShape(makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 }));
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "d", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(1);
    });
});
