import { SETTINGS_STORAGE_KEY } from "@/constants";
import {
    saveSettings,
    loadSettings,
    getDefaultSettings,
} from "../settingsStorage";

describe("settingsStorage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("should save and load settings", () => {
        const settings = {
            strokeWidth: 10,
            strokeColor: "#ff0000",
            strokePattern: "dashed" as const,
            fillColor: "#00ff00",
            opacity: 0.5,
            cornerRadius: 0,
            autosave: false,
            autosaveMethod: "on_change",
            autosaveInterval: 30000,
            theme: "system",
        };
        saveSettings(settings);
        const loaded = loadSettings();
        expect(loaded).toEqual({ ...settings, version: 1 });
    });

    test("should return default settings if nothing is saved", () => {
        const loaded = loadSettings();
        expect(loaded).toEqual(getDefaultSettings());
    });

    test("should return default settings if saved data is corrupted", () => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, "corrupted");
        const loaded = loadSettings();
        expect(loaded).toEqual(getDefaultSettings());
    });

    test("should handle partial settings", () => {
        const partialSettings = {
            version: 1,
            strokeWidth: 5,
        };
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(partialSettings)
        );
        const loaded = loadSettings();
        const defaults = getDefaultSettings();
        expect(loaded.strokeWidth).toBe(5);
        expect(loaded.strokeColor).toBe(defaults.strokeColor);
    });

    test("should clamp autosaveInterval below minimum", () => {
        const settings = {
            version: 1,
            autosaveInterval: 500, // Below 1000
        };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        const loaded = loadSettings();
        expect(loaded.autosaveInterval).toBe(1000);
    });

    test("should clamp autosaveInterval above maximum", () => {
        const settings = {
            version: 1,
            autosaveInterval: 400000, // Above 300000
        };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        const loaded = loadSettings();
        expect(loaded.autosaveInterval).toBe(300000);
    });
});
