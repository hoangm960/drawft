import { Tools } from "@/types";
import type { Point, Shape } from "@/types";

export const BOARD_STORAGE_KEY = "drawft:board:v1";
export const BOARD_STORAGE_VERSION = 1;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;

export interface PersistedBoard {
    version: number;
    shapes: Shape[];
    offset: Point;
    scale: number;
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const isPoint = (value: unknown): value is Point => {
    if (typeof value !== "object" || value === null) return false;
    const p = value as Record<string, unknown>;
    return isFiniteNumber(p.x) && isFiniteNumber(p.y);
};

const isToolType = (value: unknown): value is Tools =>
    typeof value === "string" &&
    (Object.values(Tools) as string[]).includes(value);

const isShape = (value: unknown): value is Shape => {
    if (typeof value !== "object" || value === null) return false;
    const s = value as Record<string, unknown>;
    if (!isFiniteNumber(s.id)) return false;
    if (!isToolType(s.type)) return false;
    if (!isPoint(s.from) || !isPoint(s.to)) return false;
    if (!isFiniteNumber(s.rotation)) return false;
    if (s.strokeWidth !== undefined && !isFiniteNumber(s.strokeWidth))
        return false;
    if (s.strokeColor !== undefined && typeof s.strokeColor !== "string")
        return false;
    if (
        s.strokePattern !== undefined &&
        s.strokePattern !== "solid" &&
        s.strokePattern !== "dashed" &&
        s.strokePattern !== "dotted"
    )
        return false;
    if (s.fillColor !== undefined && typeof s.fillColor !== "string")
        return false;
    if (s.cornerRadius !== undefined && !isFiniteNumber(s.cornerRadius))
        return false;
    if (
        s.opacity !== undefined &&
        (!isFiniteNumber(s.opacity) || s.opacity < 0 || s.opacity > 1)
    )
        return false;
    return true;
};

export const clampScale = (scale: number): number =>
    Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);

const getStorage = (): Storage | null => {
    try {
        if (typeof localStorage === "undefined") return null;
        return localStorage;
    } catch {
        return null;
    }
};

export const serializeBoard = (
    shapes: Map<number, Shape>,
    offset: Point,
    scale: number
): string => {
    const board: PersistedBoard = {
        version: BOARD_STORAGE_VERSION,
        shapes: [...shapes.values()],
        offset,
        scale,
    };
    return JSON.stringify(board);
};

export const saveBoard = (
    shapes: Map<number, Shape>,
    offset: Point,
    scale: number
): boolean => {
    const storage = getStorage();
    if (!storage) return false;
    try {
        storage.setItem(
            BOARD_STORAGE_KEY,
            serializeBoard(shapes, offset, scale)
        );
        return true;
    } catch {
        return false;
    }
};

export const loadBoard = (): PersistedBoard | null => {
    const storage = getStorage();
    if (!storage) return null;
    let raw: string | null;
    try {
        raw = storage.getItem(BOARD_STORAGE_KEY);
    } catch {
        return null;
    }
    if (!raw) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null) return null;
    const data = parsed as Record<string, unknown>;
    if (data.version !== BOARD_STORAGE_VERSION) return null;
    if (!Array.isArray(data.shapes)) return null;
    if (!isPoint(data.offset)) return null;
    if (!isFiniteNumber(data.scale)) return null;
    return {
        version: BOARD_STORAGE_VERSION,
        shapes: data.shapes.filter(isShape),
        offset: { x: data.offset.x, y: data.offset.y },
        scale: clampScale(data.scale),
    };
};

export const clearBoard = (): void => {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.removeItem(BOARD_STORAGE_KEY);
    } catch {
        // Ignore unavailable storage.
    }
};
