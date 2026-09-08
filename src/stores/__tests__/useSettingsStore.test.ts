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

    test("should set autosave", () => {
        useSettingsStore.getState().setAutosave(true);
        expect(useSettingsStore.getState().autosave).toBe(true);
    });

    test("should set autosave method", () => {
        useSettingsStore.getState().setAutosaveMethod("interval");
        expect(useSettingsStore.getState().autosaveMethod).toBe("interval");
    });

    test("should set autosave interval within bounds", () => {
        useSettingsStore.getState().setAutosaveInterval(5000);
        expect(useSettingsStore.getState().autosaveInterval).toBe(5000);
    });

    test("should clamp autosave interval below minimum", () => {
        useSettingsStore.getState().setAutosaveInterval(500);
        expect(useSettingsStore.getState().autosaveInterval).toBe(1000);
    });

    test("should clamp autosave interval above maximum", () => {
        useSettingsStore.getState().setAutosaveInterval(400000);
        expect(useSettingsStore.getState().autosaveInterval).toBe(300000);
    });
});
