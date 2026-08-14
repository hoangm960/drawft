import { render, screen, fireEvent } from "@testing-library/react";
import StrokePanel from "../StrokePanel";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools, type Point, type Shape } from "@/types";

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    stroke?: Partial<
        Pick<Shape, "strokeWidth" | "strokeColor" | "strokePattern">
    >
): Shape => ({ id, type: Tools.rect, from, to, rotation: 0, ...stroke });

describe("StrokePanel", () => {
    beforeEach(() => {
        useCanvasStore.getState().reset();
    });

    test("shows a hint and disables controls when nothing is selected", () => {
        render(<StrokePanel />);

        expect(screen.getByText("Select a shape")).toBeInTheDocument();
        expect(screen.getByLabelText("Stroke width")).toBeDisabled();
        expect(screen.getByLabelText("Stroke color")).toBeDisabled();
        expect(screen.getByLabelText("Stroke pattern solid")).toBeDisabled();
    });

    test("seeds the controls from the selected shape's stroke values", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(
                1,
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                {
                    strokeWidth: 6,
                    strokeColor: "#00ff00",
                    strokePattern: "dotted",
                }
            )
        );
        store.setSelectedIds([1]);

        render(<StrokePanel />);

        expect(screen.getByLabelText("Stroke width")).toHaveValue("6");
        expect(screen.getByLabelText("Stroke color")).toHaveValue("#00ff00");
        expect(screen.getByLabelText("Stroke pattern dotted")).toHaveClass(
            "bg-gray-500"
        );
    });

    test("applies the width change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<StrokePanel />);

        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeWidth).toEqual(8);
    });

    test("applies the pattern change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<StrokePanel />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().shapes.get(1)?.strokePattern).toEqual(
            "dashed"
        );
    });

    test("applies the color change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<StrokePanel />);

        fireEvent.change(screen.getByLabelText("Stroke color"), {
            target: { value: "#ff0000" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeColor).toEqual(
            "#ff0000"
        );
    });

    test("does nothing when controls are used with no selection", () => {
        render(<StrokePanel />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));
        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("renders a button for every supported pattern", () => {
        render(<StrokePanel />);

        for (const pattern of ["solid", "dashed", "dotted"]) {
            expect(
                screen.getByLabelText(`Stroke pattern ${pattern}`)
            ).toBeInTheDocument();
        }
    });
});
