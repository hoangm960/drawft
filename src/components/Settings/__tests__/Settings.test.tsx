import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "../Settings";
import { useSettingsStore } from "@stores/useSettingsStore";
import { getDefaultSettings } from "@/utils/settingsStorage";

describe("Settings", () => {
    beforeEach(() => {
        useSettingsStore.setState(getDefaultSettings());
    });
    test("renders the settings button", () => {
        render(<Settings />);
        expect(screen.getByTitle("Settings")).toBeInTheDocument();
    });

    test("does not render the modal by default", () => {
        render(<Settings />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("opens the modal when the settings button is clicked", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("closes the modal when the close button is clicked", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));
        fireEvent.click(screen.getByLabelText("Close settings"));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("closes the modal when the footer close button is clicked", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));
        fireEvent.click(screen.getByText("Close"));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("closes the modal when the escape key is pressed", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));
        fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("closes the modal when clicking on the backdrop", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));
        fireEvent.click(screen.getByRole("dialog")); // This is the backdrop
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("renders enabled controls and updates store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const strokeWidthSlider = screen.getByLabelText(/Stroke width/);
        expect(strokeWidthSlider).toBeEnabled();
        fireEvent.change(strokeWidthSlider, { target: { value: "15" } });
        expect(useSettingsStore.getState().strokeWidth).toBe(15);

        const opacitySlider = screen.getByLabelText(/Opacity/);
        expect(opacitySlider).toBeEnabled();
        fireEvent.change(opacitySlider, { target: { value: "50" } });
        expect(useSettingsStore.getState().opacity).toBe(0.5);

        const solidButton = screen.getByText("solid");
        expect(solidButton).toBeEnabled();
        fireEvent.click(solidButton);
        expect(useSettingsStore.getState().strokePattern).toBe("solid");
    });
});
