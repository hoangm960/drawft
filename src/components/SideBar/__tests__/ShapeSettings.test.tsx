import { render, screen, fireEvent } from "@testing-library/react";
import ShapeSettings from "../ShapeSettings";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools, type Shape } from "@/types";
import { makeShape } from "@/test/factories";

const renderWithSelectedShape = (
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
) => {
    const store = useCanvasStore.getState();
    store.addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }, type, props));
    store.setSelectedIds([1]);
    return render(<ShapeSettings />);
};

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
        renderWithSelectedShape(Tools.rect, {
            strokeWidth: 6,
            strokeColor: "#00ff00",
            strokePattern: "dotted",
        });

        expect(screen.getByLabelText("Stroke width")).toHaveValue("6");
        expect(screen.getByLabelText("Stroke color")).toHaveValue("#00ff00");
        expect(screen.getByLabelText("Stroke pattern dotted")).toHaveClass(
            "bg-gray-500"
        );
    });

    test("applies the width change to the selection", () => {
        renderWithSelectedShape();

        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeWidth).toEqual(8);
    });

    test("applies the pattern change to the selection", () => {
        renderWithSelectedShape();

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().shapes.get(1)?.strokePattern).toEqual(
            "dashed"
        );
    });

    test("applies the color change to the selection", () => {
        renderWithSelectedShape();

        fireEvent.change(screen.getByLabelText("Stroke color"), {
            target: { value: "#ff0000" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.strokeColor).toEqual(
            "#ff0000"
        );
    });

    test("does nothing when a pattern is clicked with no selection", () => {
        render(<ShapeSettings />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test("does nothing when the stroke width is changed with no selection", () => {
        render(<ShapeSettings />);

        fireEvent.change(screen.getByLabelText("Stroke width"), {
            target: { value: "8" },
        });

        expect(useCanvasStore.getState().shapes.size).toEqual(0);
    });

    test.each(["solid", "dashed", "dotted"])(
        "renders the %s pattern button",
        pattern => {
            render(<ShapeSettings />);

            expect(
                screen.getByLabelText(`Stroke pattern ${pattern}`)
            ).toBeInTheDocument();
        }
    );

    test("shows None active when the selected shape has no fill", () => {
        renderWithSelectedShape();

        expect(screen.getByLabelText("No fill")).toHaveClass("bg-gray-500");
    });

    test("seeds the fill color from the selected shape", () => {
        renderWithSelectedShape(Tools.rect, { fillColor: "#ff0000" });

        expect(screen.getByLabelText("Fill color")).toHaveValue("#ff0000");
        expect(screen.getByLabelText("No fill")).toHaveClass("bg-gray-700");
    });

    test("applies the fill color change to the selection", () => {
        renderWithSelectedShape();

        fireEvent.change(screen.getByLabelText("Fill color"), {
            target: { value: "#0000ff" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.fillColor).toEqual(
            "#0000ff"
        );
    });

    test("clears the fill when clicking None", () => {
        renderWithSelectedShape(Tools.rect, { fillColor: "#ff0000" });

        fireEvent.click(screen.getByLabelText("No fill"));

        expect(
            useCanvasStore.getState().shapes.get(1)?.fillColor
        ).toBeUndefined();
    });

    test("seeds the corner radius from a selected rect", () => {
        renderWithSelectedShape(Tools.rect, { cornerRadius: 12 });

        expect(screen.getByLabelText("Corner radius")).toHaveValue("12");
    });

    test("shows the corner radius control for a selected diamond", () => {
        renderWithSelectedShape(Tools.dia);

        expect(screen.getByLabelText("Corner radius")).toBeInTheDocument();
    });

    test("hides the corner radius control for a selected line", () => {
        renderWithSelectedShape(Tools.line);

        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });

    test("hides the corner radius control when the selection mixes shapes", () => {
        const store = useCanvasStore.getState();
        const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        const shape2 = makeShape(
            2,
            { x: 20, y: 0 },
            { x: 30, y: 10 },
            Tools.line
        );
        store.addShape(shape1);
        store.addShape(shape2);
        store.setSelectedIds([1, 2]);

        render(<ShapeSettings />);

        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });

    test("applies the corner radius change to the selection", () => {
        renderWithSelectedShape();

        fireEvent.change(screen.getByLabelText("Corner radius"), {
            target: { value: "25" },
        });

        expect(useCanvasStore.getState().shapes.get(1)?.cornerRadius).toEqual(
            25
        );
    });

    test("groups a slider drag into a single undo step", () => {
        renderWithSelectedShape();
        const width = screen.getByLabelText("Stroke width");
        const pastLength = useCanvasStore.getState().past.length;

        fireEvent.mouseDown(width);
        fireEvent.change(width, { target: { value: "8" } });
        fireEvent.change(width, { target: { value: "12" } });
        fireEvent.change(width, { target: { value: "6" } });
        fireEvent.mouseUp(width);

        expect(useCanvasStore.getState().past.length).toEqual(pastLength + 1);

        useCanvasStore.getState().undo();

        expect(
            useCanvasStore.getState().shapes.get(1)?.strokeWidth
        ).toBeUndefined();
    });

    test("commits a color change on blur", () => {
        renderWithSelectedShape();
        const color = screen.getByLabelText("Stroke color");
        const pastLength = useCanvasStore.getState().past.length;

        fireEvent.focus(color);
        fireEvent.change(color, { target: { value: "#ff0000" } });
        fireEvent.blur(color);

        expect(useCanvasStore.getState().past.length).toEqual(pastLength + 1);

        useCanvasStore.getState().undo();

        expect(
            useCanvasStore.getState().shapes.get(1)?.strokeColor
        ).toBeUndefined();
    });

    test("records a single undo step for a pattern click", () => {
        renderWithSelectedShape();
        const pastLength = useCanvasStore.getState().past.length;

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().past.length).toEqual(pastLength + 1);

        useCanvasStore.getState().undo();

        expect(
            useCanvasStore.getState().shapes.get(1)?.strokePattern
        ).toBeUndefined();
    });

    test("records a single undo step for clearing the fill", () => {
        renderWithSelectedShape(Tools.rect, { fillColor: "#ff0000" });
        const pastLength = useCanvasStore.getState().past.length;

        fireEvent.click(screen.getByLabelText("No fill"));

        expect(useCanvasStore.getState().past.length).toEqual(pastLength + 1);
    });

    test("records no history when a control changes nothing", () => {
        renderWithSelectedShape();
        const color = screen.getByLabelText("Stroke color");
        const pastLength = useCanvasStore.getState().past.length;

        fireEvent.focus(color);
        fireEvent.blur(color);

        expect(useCanvasStore.getState().past.length).toEqual(pastLength);
    });

    test("records no history when a pattern is clicked with no selection", () => {
        render(<ShapeSettings />);

        fireEvent.click(screen.getByLabelText("Stroke pattern dashed"));

        expect(useCanvasStore.getState().past.length).toEqual(0);
    });
});
