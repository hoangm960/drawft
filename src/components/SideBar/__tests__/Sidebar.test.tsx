import { render, screen } from "@testing-library/react";
import Sidebar from "../Sidebar";
import { useCanvasStore } from "@stores/useCanvasStore";

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

    test("shows a hint and disables controls when nothing is selected", () => {
        render(<Sidebar />);

        expect(screen.getByText("Select a shape")).toBeInTheDocument();
        expect(screen.getByLabelText("Stroke width")).toBeDisabled();
        expect(screen.getByLabelText("Fill color")).toBeDisabled();
    });
});
