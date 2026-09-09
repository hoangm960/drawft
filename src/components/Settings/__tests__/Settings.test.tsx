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
        fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
        expect(screen.getByRole("dialog")).toBeInTheDocument(); // still open

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

    test("enables save options and updates store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const autosaveCheckbox = screen.getByLabelText(
            "Autosave enabled"
        ) as HTMLInputElement;
        expect(autosaveCheckbox).toBeEnabled();
        fireEvent.click(autosaveCheckbox);
        expect(useSettingsStore.getState().autosave).toBe(true);

        const intervalRadio = screen.getByLabelText("Interval");
        fireEvent.click(intervalRadio);
        expect(useSettingsStore.getState().autosaveMethod).toBe("interval");
    });

    test("enables canvas background color and updates store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const bgColorInput = screen.getByLabelText("Background color");
        expect(bgColorInput).toBeEnabled();
        fireEvent.change(bgColorInput, { target: { value: "#123456" } });
        expect(useSettingsStore.getState().canvasBackgroundColor).toBe(
            "#123456"
        );
    });

    test("updates DefaultStylingSection controls and store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        // Stroke color
        const strokeColorInput = screen.getByLabelText("Stroke color");
        fireEvent.change(strokeColorInput, { target: { value: "#ff0000" } });
        expect(useSettingsStore.getState().strokeColor).toBe("#ff0000");

        const autoButton = screen.getByText("Auto");
        fireEvent.click(autoButton);
        expect(useSettingsStore.getState().strokeColor).toBeUndefined();

        // Fill color
        const fillColorInput = screen.getByLabelText("Fill color");
        fireEvent.change(fillColorInput, { target: { value: "#00ff00" } });
        expect(useSettingsStore.getState().fillColor).toBe("#00ff00");

        const noneButton = screen.getByText("None");
        fireEvent.click(noneButton);
        expect(useSettingsStore.getState().fillColor).toBe("transparent");

        // Corner radius
        const cornerRadiusSlider = screen.getByLabelText(/Corner radius/);
        fireEvent.change(cornerRadiusSlider, { target: { value: "25" } });
        expect(useSettingsStore.getState().cornerRadius).toBe(25);
    });

    test("resets canvas background color to theme default", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const bgColorInput = screen.getByLabelText("Background color");
        fireEvent.change(bgColorInput, { target: { value: "#123456" } });
        expect(useSettingsStore.getState().canvasBackgroundColor).toBe("#123456");

        const resetButton = screen.getByText("Reset to Theme Default");
        fireEvent.click(resetButton);
        expect(useSettingsStore.getState().canvasBackgroundColor).toBeUndefined();
    });

    test("updates SaveSection controls and store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const autosaveCheckbox = screen.getByLabelText("Autosave enabled") as HTMLInputElement;
        if (!autosaveCheckbox.checked) {
            fireEvent.click(autosaveCheckbox);
        }

        const intervalRadio = screen.getByLabelText("Interval");
        fireEvent.click(intervalRadio);
        expect(useSettingsStore.getState().autosaveMethod).toBe("interval");

        const onChangeRadio = screen.getByLabelText("On change");
        fireEvent.click(onChangeRadio);
        expect(useSettingsStore.getState().autosaveMethod).toBe("on_change");

        fireEvent.click(intervalRadio);
        expect(useSettingsStore.getState().autosaveMethod).toBe("interval");

        const intervalInput = screen.getByRole("spinbutton");
        fireEvent.change(intervalInput, { target: { value: "45" } });
        expect(useSettingsStore.getState().autosaveInterval).toBe(45000);
    });

    test("updates ThemeSection controls and store", () => {
        render(<Settings />);
        fireEvent.click(screen.getByTitle("Settings"));

        const darkRadio = screen.getByLabelText("dark");
        fireEvent.click(darkRadio);
        expect(useSettingsStore.getState().theme).toBe("dark");

        const lightRadio = screen.getByLabelText("light");
        fireEvent.click(lightRadio);
        expect(useSettingsStore.getState().theme).toBe("light");

        const systemRadio = screen.getByLabelText("system");
        fireEvent.click(systemRadio);
        expect(useSettingsStore.getState().theme).toBe("system");
    });
});
