import type { StrokePattern } from "@/types";
import {
    DEFAULT_CORNER_RADIUS,
    DEFAULT_OPACITY,
    DEFAULT_STROKE,
    DEFAULT_FILL,
} from "@/utils/shapes";

export const SETTINGS_STORAGE_KEY = "drawft:settings:v1";
export const SETTINGS_STORAGE_VERSION = 1;

export interface PersistedSettings {
    version: number;
    strokeWidth: number;
    strokeColor: string;
    strokePattern: StrokePattern;
    fillColor?: string;
    opacity: number;
    cornerRadius: number;
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const isStrokePattern = (value: unknown): value is StrokePattern =>
    typeof value === "string" &&
    (value === "solid" || value === "dashed" || value === "dotted");

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
        if (isFiniteNumber(data.strokeWidth)) {
            settings.strokeWidth = data.strokeWidth;
        }
        if (typeof data.strokeColor === "string") {
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
        return settings;
    } catch {
        return getDefaultSettings();
    }
};

export const getDefaultSettings = (): PersistedSettings => ({
    version: SETTINGS_STORAGE_VERSION,
    strokeWidth: DEFAULT_STROKE.strokeWidth,
    strokeColor: DEFAULT_STROKE.strokeColor,
    strokePattern: DEFAULT_STROKE.strokePattern,
    fillColor: DEFAULT_FILL.fillColor,
    opacity: DEFAULT_OPACITY,
    cornerRadius: DEFAULT_CORNER_RADIUS,
});
