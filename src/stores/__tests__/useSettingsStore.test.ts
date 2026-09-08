import { useSettingsStore } from "../useSettingsStore";
import { getDefaultSettings } from "@/utils/settingsStorage";

describe("useSettingsStore", () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useSettingsStore.setState(getDefaultSettings());
    });

    test("should set stroke width", () => {
        useSettingsStore.getState().setStrokeWidth(10);
        expect(useSettingsStore.getState().strokeWidth).toBe(10);
    });

    test("should set stroke color", () => {
        useSettingsStore.getState().setStrokeColor("#ff0000");
        expect(useSettingsStore.getState().strokeColor).toBe("#ff0000");
    });

    test("should set fill color", () => {
        useSettingsStore.getState().setFillColor("#00ff00");
        expect(useSettingsStore.getState().fillColor).toBe("#00ff00");
    });

    test("should unset fill color", () => {
        useSettingsStore.getState().setFillColor(undefined);
        expect(useSettingsStore.getState().fillColor).toBe("transparent");
    });

    test("should set opacity", () => {
        useSettingsStore.getState().setOpacity(0.5);
        expect(useSettingsStore.getState().opacity).toBe(0.5);
    });
});
