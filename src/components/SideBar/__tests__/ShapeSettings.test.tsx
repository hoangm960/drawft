import { render, screen, fireEvent } from "@testing-library/react";
import ShapeSettings from "../ShapeSettings";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools, type Point, type Shape } from "@/types";

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect,
    props?: Partial<
        Pick<
            Shape,
            | "strokeWidth"
            | "strokeColor"
            | "strokePattern"
            | "fillColor"
            | "cornerRadius"
        >
    >
): Shape => ({ id, type, from, to, rotation: 0, ...props });

describe("ShapeSettings", () => {
    beforeEach(() => {
        useCanvasStore.getState().reset();
    });

    test("shows a hint and disables controls when nothing is selected", () => {
        render(<ShapeSettings />);

        expect(screen.getByText("Select a shape")).toBeInTheDocument();
        expect(screen.getByLabelText("Stroke width")).toBeDisabled();
        expect(screen.getByLabelText("Stroke color")).toBeDisabled();
        expect(screen.getByLabelText("Stroke pattern solid")).toBeDisabled();
        expect(screen.getByLabelText("Fill color")).toBeDisabled();
        expect(screen.getByLabelText("No fill")).toBeDisabled();
        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });

    test("seeds the controls from the selected shape's stroke values", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.rect, {
                strokeWidth: 6,
                strokeColor: "#00ff00",
                strokePattern: "dotted",
            })
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

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

        render(<ShapeSettings />);

        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeWidth).toEqual(8);
    });

    test("applies the pattern change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().shapes.get(1)?.strokePattern).toEqual(
            "dashed"
        );
    });

    test("applies the color change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        fireEvent.change(screen.getByLabelText("Stroke color"), {
            target: { value: "#ff0000" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeColor).toEqual(
            "#ff0000"
        );
    });

    test("does nothing when controls are used with no selection", () => {
        render(<ShapeSettings />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));
        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("renders a button for every supported pattern", () => {
        render(<ShapeSettings />);

        for (const pattern of ["solid", "dashed", "dotted"]) {
            expect(
                screen.getByLabelText(`Stroke pattern ${pattern}`)
            ).toBeInTheDocument();
        }
    });

    test("shows None active when the selected shape has no fill", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        expect(screen.getByLabelText("No fill")).toHaveClass("bg-gray-500");
    });

    test("seeds the fill color from the selected shape", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.rect, {
                fillColor: "#ff0000",
            })
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        expect(screen.getByLabelText("Fill color")).toHaveValue("#ff0000");
        expect(screen.getByLabelText("No fill")).toHaveClass("bg-gray-700");
    });

    test("applies the fill color change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        fireEvent.change(screen.getByLabelText("Fill color"), {
            target: { value: "#0000ff" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.fillColor).toEqual(
            "#0000ff"
        );
    });

    test("clears the fill when clicking None", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.rect, {
                fillColor: "#ff0000",
            })
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        fireEvent.click(screen.getByLabelText("No fill"));

        expect(
            useCanvasStore.getState().shapes.get(1)?.fillColor
        ).toBeUndefined();
    });

    test("seeds the corner radius from a selected rect", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.rect, {
                cornerRadius: 12,
            })
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        expect(screen.getByLabelText("Corner radius")).toHaveValue("12");
    });

    test("shows the corner radius control for a selected diamond", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.dia)
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        expect(screen.getByLabelText("Corner radius")).toBeInTheDocument();
    });

    test("hides the corner radius control for a selected line", () => {
        const store = useCanvasStore.getState();
        store.addShape(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, Tools.line)
        );
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });

    test("hides the corner radius control when the selection mixes shapes", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.addShape(
            makeShape(2, { x: 20, y: 0 }, { x: 30, y: 10 }, Tools.line)
        );
        store.setSelectedIds([1, 2]);

        render(<ShapeSettings />);

        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });

    test("applies the corner radius change to the selection", () => {
        const store = useCanvasStore.getState();
        store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        store.setSelectedIds([1]);

        render(<ShapeSettings />);

        fireEvent.change(screen.getByLabelText("Corner radius"), {
            target: { value: "25" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.cornerRadius).toEqual(
            25
        );
    });
});
