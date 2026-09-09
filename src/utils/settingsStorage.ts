import type { StrokePattern } from "@/types";
import {
    DEFAULT_CORNER_RADIUS,
    DEFAULT_OPACITY,
    DEFAULT_STROKE,
    DEFAULT_FILL,
    SETTINGS_STORAGE_KEY,
    SETTINGS_STORAGE_VERSION,
    MIN_AUTOSAVE_INTERVAL,
    MAX_AUTOSAVE_INTERVAL,
} from "@/constants";

export type AutosaveMethod = "on_change" | "interval";
export type ThemeMode = "system" | "light" | "dark";

export interface PersistedSettings {
    version: number;
    theme: ThemeMode;
    strokeWidth: number;
    strokeColor?: string;
    strokePattern: StrokePattern;
    fillColor?: string;
    opacity: number;
    cornerRadius: number;
    autosave: boolean;
    autosaveMethod: AutosaveMethod;
    autosaveInterval: number;
    canvasBackgroundColor?: string;
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const isStrokePattern = (value: unknown): value is StrokePattern =>
    typeof value === "string" &&
    (value === "solid" || value === "dashed" || value === "dotted");

const isAutosaveMethod = (value: unknown): value is AutosaveMethod =>
    typeof value === "string" &&
    (value === "on_change" || value === "interval");

const isThemeMode = (value: unknown): value is ThemeMode =>
    typeof value === "string" &&
    (value === "system" || value === "light" || value === "dark");

export const clampAutosaveInterval = (interval: number): number =>
    Math.min(Math.max(interval, MIN_AUTOSAVE_INTERVAL), MAX_AUTOSAVE_INTERVAL);

const getStorage = (): Storage | null => {
    try {
        if (typeof localStorage === "undefined") return null;
        return localStorage;
    } catch {
        return null;
    }
};

export const saveSettings = (settings: Omit<PersistedSettings, "version">) => {
    const storage = getStorage();
    if (!storage) return false;
    try {
        const data: PersistedSettings = {
            ...settings,
            version: SETTINGS_STORAGE_VERSION,
        };
        storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
};

export const loadSettings = (): PersistedSettings => {
    const storage = getStorage();
    if (!storage) return getDefaultSettings();
    let raw: string | null = null;
    try {
        raw = storage.getItem(SETTINGS_STORAGE_KEY);
    } catch {
        // ignore
    }
    if (!raw) return getDefaultSettings();

    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) {
            return getDefaultSettings();
        }
        const data = parsed as Record<string, unknown>;
        if (data.version !== SETTINGS_STORAGE_VERSION) {
            return getDefaultSettings();
        }

        const settings: PersistedSettings = getDefaultSettings();
        if (isThemeMode(data.theme)) {
            settings.theme = data.theme;
        }
        if (isFiniteNumber(data.strokeWidth)) {
            settings.strokeWidth = data.strokeWidth;
        }
        if (
            typeof data.strokeColor === "string" ||
            data.strokeColor === undefined
        ) {
            settings.strokeColor = data.strokeColor;
        }
        if (isStrokePattern(data.strokePattern)) {
            settings.strokePattern = data.strokePattern;
        }
        if (
            typeof data.fillColor === "string" ||
            data.fillColor === undefined
        ) {
            settings.fillColor = data.fillColor;
        }
        if (isFiniteNumber(data.opacity)) {
            settings.opacity = data.opacity;
        }
        if (isFiniteNumber(data.cornerRadius)) {
            settings.cornerRadius = data.cornerRadius;
        }
        if (typeof data.autosave === "boolean") {
            settings.autosave = data.autosave;
        }
        if (isAutosaveMethod(data.autosaveMethod)) {
            settings.autosaveMethod = data.autosaveMethod;
        }
        if (isFiniteNumber(data.autosaveInterval)) {
            settings.autosaveInterval = clampAutosaveInterval(
                data.autosaveInterval
            );
        }
        if (
            typeof data.canvasBackgroundColor === "string" ||
            data.canvasBackgroundColor === undefined
        ) {
            settings.canvasBackgroundColor = data.canvasBackgroundColor;
        }
        return settings;
    } catch {
        return getDefaultSettings();
    }
};

export const getDefaultSettings = (): PersistedSettings => ({
    version: SETTINGS_STORAGE_VERSION,
    theme: "system",
    strokeWidth: DEFAULT_STROKE.strokeWidth,
    strokePattern: DEFAULT_STROKE.strokePattern,
    fillColor: DEFAULT_FILL.fillColor,
    opacity: DEFAULT_OPACITY,
    cornerRadius: DEFAULT_CORNER_RADIUS,
    autosave: false,
    autosaveMethod: "on_change",
    autosaveInterval: 30000,
});
