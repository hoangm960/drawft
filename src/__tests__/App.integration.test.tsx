import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useTool } from "@stores/useToolStore";
import { useSettingsStore } from "@stores/useSettingsStore";
import { Tools } from "@/types";
import { createMockContext, type MockHit } from "@/test/factories";

const canvas = () => document.getElementById("whiteboard") as HTMLElement;

describe("App Integration", () => {
    let hit: MockHit;

    beforeEach(() => {
        hit = { inStroke: false, inPath: false };
        useTool.getState().setTool(Tools.select);
        useCanvasStore.getState().reset();

        useSettingsStore.setState({
            strokeWidth: 2,
            strokeColor: undefined,
            strokePattern: "solid",
            fillColor: "transparent",
            opacity: 1,
            cornerRadius: 0,
            theme: "system",
        });
        jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            createMockContext(hit) as unknown as CanvasRenderingContext2D
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("updates specific shape properties in canvas store when changed via sidebar settings UI", () => {
        render(<App />);

        act(() => {
            useTool.getState().setTool(Tools.rect);
        });
        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(canvas());

        act(() => {
            useTool.getState().setTool(Tools.select);
        });
        hit.inStroke = true;
        fireEvent.mouseDown(canvas(), { clientX: 150, clientY: 150 });

        const store = useCanvasStore.getState();
        expect(store.shapes.size).toBe(1);
        expect(store.selectedIds).toEqual([0]);

        const widthSlider = screen.getByLabelText("Stroke width");
        fireEvent.change(widthSlider, { target: { value: "10" } });

        expect(useCanvasStore.getState().shapes.get(0)?.strokeWidth).toBe(10);
    });

    test("syncs UI state and canvas store when undoing an action via keyboard shortcut", () => {
        render(<App />);

        act(() => {
            useTool.getState().setTool(Tools.rect);
        });
        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(canvas());

        act(() => {
            useTool.getState().setTool(Tools.select);
        });
        hit.inStroke = true;
        fireEvent.mouseDown(canvas(), { clientX: 150, clientY: 150 });

        const dashedBtn = screen.getByLabelText("Stroke pattern dashed");
        fireEvent.click(dashedBtn);

        expect(useCanvasStore.getState().shapes.get(0)?.strokePattern).toBe(
            "dashed"
        );

        fireEvent.keyDown(window, { key: "z", ctrlKey: true });

        expect(useCanvasStore.getState().shapes.get(0)?.strokePattern).toBe(
            "solid"
        );
    });

    test("disables toolbar buttons during active canvas interactions like dragging", () => {
        render(<App />);

        act(() => {
            useTool.getState().setTool(Tools.rect);
        });

        const rectBtn = screen.getByTitle(/Rectangle/);

        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 150, clientY: 150 });

        expect(useCanvasStore.getState().isDragging).toBe(true);
        expect(rectBtn).toHaveClass("pointer-events-none");

        fireEvent.mouseUp(canvas());

        expect(useCanvasStore.getState().isDragging).toBe(false);
        expect(rectBtn).not.toHaveClass("pointer-events-none");
    });

    test("applies global default settings to newly drawn shapes when changed via UI", () => {
        render(<App />);

        act(() => {
            useSettingsStore.setState({ strokeColor: "#ff0000" });
        });

        expect(useSettingsStore.getState().strokeColor).toBe("#ff0000");

        act(() => {
            useTool.getState().setTool(Tools.rect);
        });
        fireEvent.mouseDown(canvas(), { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas(), { clientX: 200, clientY: 200 });

        const currentShape = useCanvasStore.getState().currentShape;
        expect(currentShape?.strokeColor).toBe("#ff0000");

        fireEvent.mouseUp(canvas());
    });
});
