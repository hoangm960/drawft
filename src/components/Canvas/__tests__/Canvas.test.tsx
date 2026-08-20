import { render, fireEvent } from "@testing-library/react";
import Canvas from "../Canvas";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools } from "@/types";
import { createMockContext, makeShape, type MockHit } from "@/test/factories";

const canvas = () => document.getElementById("whiteboard") as HTMLElement;

const originalViewport = {
    width: window.innerWidth,
    height: window.innerHeight,
};

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
        window.innerWidth = originalViewport.width;
        window.innerHeight = originalViewport.height;
    });

    test("renders a canvas with the whiteboard id", () => {
        render(<Canvas />);

        expect(canvas()).toBeInTheDocument();
        expect(canvas().tagName).toEqual("CANVAS");
    });

    test("shows a grab cursor when the pan tool is active", () => {
        useTool.getState().setTool(Tools.pan);
        render(<Canvas />);

        expect(canvas()).toHaveClass("cursor-grab");
    });

    test("shows no custom cursor when the select tool is active", () => {
        useTool.getState().setTool(Tools.select);
        render(<Canvas />);

        expect(canvas()).not.toHaveClass(/cursor-/);
    });

    test("uses the crosshair cursor for drawing tools", () => {
        useTool.getState().setTool(Tools.rect);
        render(<Canvas />);

        expect(canvas()).toHaveClass("cursor-crosshair");
    });

    test("zooms in when scrolling up", () => {
        render(<Canvas />);

        fireEvent.wheel(canvas(), { deltaY: -100 });

        expect(useCanvasStore.getState().scale).toBeCloseTo(1.1);
    });

    test("zooms out when scrolling down", () => {
        render(<Canvas />);

        fireEvent.wheel(canvas(), { deltaY: 100 });

        expect(useCanvasStore.getState().scale).toBeCloseTo(0.9);
    });

    test("clamps zoom to the minimum allowed scale", () => {
        useCanvasStore.getState().setScale(0.1);
        render(<Canvas />);

        fireEvent.wheel(canvas(), { deltaY: 100000 });

        expect(useCanvasStore.getState().scale).toEqual(0.1);
    });

    test("clamps zoom to the maximum allowed scale", () => {
        useCanvasStore.getState().setScale(5);
        render(<Canvas />);

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
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(canvas());

        expect(new Set(useCanvasStore.getState().selectedIds)).toEqual(
            new Set([0, 1])
        );
    });

    test("selects a shape when clicked on it", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });

        expect(useCanvasStore.getState().selectedIds).toEqual([0]);
    });

    test("resizes a selected shape by dragging a corner handle", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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
        const arrow = makeShape(
            0,
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            Tools.arrow
        );
        useCanvasStore.getState().addShape(arrow);
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
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 200, y: 200 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
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
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Delete" });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("clears the selection after deleting with the Delete key", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Delete" });

        expect(useCanvasStore.getState().selectedIds).toEqual([]);
    });

    test("deletes the selected shape with the Backspace key", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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

    test("selects a shape on click", () => {
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });

        expect(useCanvasStore.getState().selectedIds).toEqual([1]);
    });

    test("deselects a selected shape on shift+click", () => {
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
        useCanvasStore.getState().setSelectedIds([1]);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), {
            clientX: 50,
            clientY: 50,
            shiftKey: true,
        });

        expect(useCanvasStore.getState().selectedIds).toEqual([]);
    });

    test("selects a shape on shift+click when the selection is empty", () => {
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), {
            clientX: 50,
            clientY: 50,
            shiftKey: true,
        });

        expect(useCanvasStore.getState().selectedIds).toEqual([1]);
    });

    test("moves a selected shape by dragging it", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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

    test("undoes an entire multi-move drag in one step", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(canvas(), { clientX: 70, clientY: 80 });
        fireEvent.mouseMove(canvas(), { clientX: 90, clientY: 110 });
        fireEvent.mouseMove(canvas(), { clientX: 110, clientY: 140 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().shapes.get(0)?.from).toEqual({
            x: 60,
            y: 90,
        });

        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.get(0)).toEqual(shape);
    });

    test("a click without dragging records no history", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        hit.inStroke = true;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().past.length).toEqual(1);

        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("clears the selection when clicking empty space without shift", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        hit.inStroke = false;
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 400, clientY: 400 });

        expect(useCanvasStore.getState().selectedIds).toEqual([]);
        expect(useCanvasStore.getState().isBoxSelecting).toBe(true);
    });

    test("keeps the selection when shift+clicking empty space", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseMove(canvas(), { clientX: 50, clientY: -50 });

        expect(canvas()).toHaveClass("cursor-grab");
    });

    test("clears the cursor when the mouse leaves the canvas", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseMove(canvas(), { clientX: 50, clientY: -50 });
        fireEvent.mouseLeave(canvas());

        expect(canvas()).not.toHaveClass(/cursor-/);
    });

    test("shows a resize cursor when hovering a corner handle", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseMove(canvas(), { clientX: 100, clientY: 100 });
        expect(canvas()).toHaveClass("cursor-nwse-resize");
    });

    test("rotates a selected shape by dragging the rotate handle", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: -50 });
        fireEvent.mouseMove(canvas(), { clientX: 100, clientY: 50 });
        fireEvent.mouseUp(canvas());

        const rotated = useCanvasStore.getState().shapes.get(0)!;
        expect(rotated.rotation).toBeCloseTo(Math.PI / 2);
        expect(rotated.from).toEqual({ x: 0, y: 0 });
        expect(rotated.to).toEqual({ x: 100, y: 100 });
    });

    test("box-selects shapes when dragging outside the canvas", () => {
        const shape1 = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        const shape2 = makeShape(1, { x: 150, y: 150 }, { x: 250, y: 250 });
        useCanvasStore.getState().addShape(shape1);
        useCanvasStore.getState().addShape(shape2);
        render(<Canvas />);

        fireEvent.mouseDown(canvas(), { clientX: 50, clientY: 50 });
        fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(window);

        expect(new Set(useCanvasStore.getState().selectedIds)).toEqual(
            new Set([0, 1])
        );
    });

    test("does nothing when pressing Delete with no selection", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "Delete" });

        expect(useCanvasStore.getState().shapes.size).toEqual(1);
    });

    test("copies the selected shapes with Ctrl+C", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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

    test("pastes the clipboard at the cursor with Ctrl+V and selects the pasted shape", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);
        fireEvent.keyDown(window, { key: "c", ctrlKey: true });

        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.keyDown(window, { key: "v", ctrlKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(2);
        expect(state.shapes.get(1)).toEqual({
            id: 1,
            type: Tools.rect,
            from: { x: 150, y: 150 },
            to: { x: 250, y: 250 },
            rotation: 0,
        });
        expect(state.selectedIds).toEqual([1]);
    });

    test("pastes at the viewport center when the cursor is unknown", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        window.innerWidth = 400;
        window.innerHeight = 300;
        render(<Canvas />);
        fireEvent.keyDown(window, { key: "c", ctrlKey: true });

        fireEvent.keyDown(window, { key: "v", ctrlKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.get(1)?.from).toEqual({ x: 150, y: 100 });
        expect(state.shapes.get(1)?.to).toEqual({ x: 250, y: 200 });
    });

    test("duplicates the selected shape with Ctrl+D", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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

    test("undoes the last action with Ctrl+Z", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("redoes an undone action with Ctrl+Shift+Z", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);
        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        fireEvent.keyDown(window, {
            key: "z",
            ctrlKey: true,
            shiftKey: true,
        });

        expect(useCanvasStore.getState().shapes.get(0)).toEqual(shape);
    });

    test("redoes an undone action with Ctrl+Y", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);
        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        fireEvent.keyDown(window, { key: "y", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.get(0)).toEqual(shape);
    });

    test("treats Cmd+Z like Ctrl+Z", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "z", metaKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("treats Cmd shortcuts like Ctrl shortcuts", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        useCanvasStore.getState().setSelectedIds([0]);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "c", metaKey: true });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.keyDown(window, { key: "v", metaKey: true });

        const state = useCanvasStore.getState();
        expect(state.shapes.size).toEqual(2);
        expect(state.shapes.get(1)?.from).toEqual({ x: 150, y: 150 });
        expect(state.selectedIds).toEqual([1]);
    });

    test("does nothing on copy with no selection", () => {
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
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
        const shape = makeShape(0, { x: 0, y: 0 }, { x: 100, y: 100 });
        useCanvasStore.getState().addShape(shape);
        render(<Canvas />);

        fireEvent.keyDown(window, { key: "d", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.size).toEqual(1);
    });
});
