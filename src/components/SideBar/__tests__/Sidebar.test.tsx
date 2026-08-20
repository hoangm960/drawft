import { render, screen } from "@testing-library/react";
import Sidebar from "../Sidebar";
import { useCanvasStore } from "@stores/useCanvasStore";
import { Tools } from "@/types";
import { makeShape } from "@/test/factories";

describe("Sidebar", () => {
    beforeEach(() => {
        useCanvasStore.getState().reset();
    });

    test("renders the shape settings inline without a toggle", () => {
        render(<Sidebar />);

        expect(screen.getByText("Stroke")).toBeInTheDocument();
        expect(screen.getByLabelText("Stroke width")).toBeInTheDocument();
        expect(screen.getByLabelText("Stroke color")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Stroke pattern solid")
        ).toBeInTheDocument();
        expect(screen.getByText("Fill")).toBeInTheDocument();
        expect(screen.getByLabelText("Fill color")).toBeInTheDocument();
        expect(screen.getByLabelText("No fill")).toBeInTheDocument();
    });

    test("does not render a Fill button", () => {
        render(<Sidebar />);

        expect(screen.queryByTitle("Fill")).not.toBeInTheDocument();
    });

    test("shows a hint when nothing is selected", () => {
        render(<Sidebar />);

        expect(screen.getByText("Select a shape")).toBeInTheDocument();
    });

    test("disables the controls when nothing is selected", () => {
        render(<Sidebar />);

        expect(screen.getByLabelText("Stroke width")).toBeDisabled();
        expect(screen.getByLabelText("Fill color")).toBeDisabled();
    });

    test("shows the corner radius control when a rect is selected", () => {
        const store = useCanvasStore.getState();
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        store.addShape(shape);
        store.setSelectedIds([1]);

        render(<Sidebar />);

        expect(screen.getByLabelText("Corner radius")).toBeInTheDocument();
    });

    test("hides the corner radius control when a line is selected", () => {
        const store = useCanvasStore.getState();
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            Tools.line
        );
        store.addShape(shape);
        store.setSelectedIds([1]);

        render(<Sidebar />);

        expect(
            screen.queryByLabelText("Corner radius")
        ).not.toBeInTheDocument();
    });
});
