import { Tools } from "@/types";
import { makeShape } from "@/test/factories";
import { BOARD_STORAGE_KEY } from "@/constants";
import {
    clearBoard,
    loadBoard,
    saveBoard,
    serializeBoard,
} from "../boardStorage";
import { safeStorage } from "../safeStorage";

describe("boardStorage", () => {
    beforeEach(() => {
        localStorage.clear();
        safeStorage._reset();
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("serializeBoard includes version, shapes, offset and scale", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        const raw = serializeBoard(new Map([[1, shape]]), { x: 5, y: 6 }, 2);
        const parsed = JSON.parse(raw);

        expect(parsed.version).toEqual(1);
        expect(parsed.shapes).toEqual([shape]);
        expect(parsed.offset).toEqual({ x: 5, y: 6 });
        expect(parsed.scale).toEqual(2);
    });

    test("saveBoard writes and loadBoard reads the board back", () => {
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            Tools.ellipse,
            { strokeWidth: 4 }
        );
        expect(saveBoard(new Map([[1, shape]]), { x: 7, y: 8 }, 1.5)).toBe(
            true
        );

        expect(loadBoard()).toEqual({
            version: 1,
            shapes: [shape],
            offset: { x: 7, y: 8 },
            scale: 1.5,
        });
    });

    test("loadBoard returns null when nothing is stored", () => {
        expect(loadBoard()).toBeNull();
    });

    test("loadBoard returns null for corrupt JSON", () => {
        localStorage.setItem(BOARD_STORAGE_KEY, "{not-json");
        expect(loadBoard()).toBeNull();
    });

    test("loadBoard returns null for an unsupported version", () => {
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 999,
                shapes: [],
                offset: { x: 0, y: 0 },
                scale: 1,
            })
        );
        expect(loadBoard()).toBeNull();
    });

    test("loadBoard filters out invalid shapes", () => {
        const valid = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [valid, { id: "bad" }, null, { type: "circle" }],
                offset: { x: 0, y: 0 },
                scale: 1,
            })
        );
        expect(loadBoard()?.shapes).toEqual([valid]);
    });

    test("loadBoard clamps scale to the supported range", () => {
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [],
                offset: { x: 0, y: 0 },
                scale: 99,
            })
        );
        expect(loadBoard()?.scale).toEqual(5);

        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [],
                offset: { x: 0, y: 0 },
                scale: 0.001,
            })
        );
        expect(loadBoard()?.scale).toEqual(0.1);
    });

    test("saveBoard round-trips shape opacity", () => {
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            Tools.rect,
            { opacity: 0.4 }
        );
        expect(saveBoard(new Map([[1, shape]]), { x: 0, y: 0 }, 1)).toBe(true);

        expect(loadBoard()?.shapes).toEqual([shape]);
    });

    test("loadBoard keeps shapes without opacity for backward compat", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [shape],
                offset: { x: 0, y: 0 },
                scale: 1,
            })
        );

        expect(loadBoard()?.shapes).toEqual([shape]);
    });

    test("loadBoard filters out shapes with invalid opacity", () => {
        const valid = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            Tools.rect,
            { opacity: 0.5 }
        );
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [
                    valid,
                    { ...valid, id: 2, opacity: -0.1 },
                    { ...valid, id: 3, opacity: 2 },
                    { ...valid, id: 4, opacity: "0.5" },
                ],
                offset: { x: 0, y: 0 },
                scale: 1,
            })
        );

        expect(loadBoard()?.shapes).toEqual([valid]);
    });

    test("loadBoard filters out shapes with invalid styling properties", () => {
        const valid = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            Tools.rect
        );
        localStorage.setItem(
            BOARD_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                shapes: [
                    valid,
                    { ...valid, id: 2, strokeWidth: "5" },
                    { ...valid, id: 3, strokeColor: 123 },
                    { ...valid, id: 4, strokePattern: "wavy" },
                    { ...valid, id: 5, fillColor: true },
                    { ...valid, id: 6, cornerRadius: "10" },
                ],
                offset: { x: 0, y: 0 },
                scale: 1,
            })
        );

        expect(loadBoard()?.shapes).toEqual([valid]);
    });

    test("saveBoard returns false when storage throws", () => {
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota exceeded");
        });
        try {
            expect(saveBoard(new Map(), { x: 0, y: 0 }, 1)).toBe(false);
        } finally {
            jest.restoreAllMocks();
        }
    });

    test("loadBoard returns null when storage.getItem throws", () => {
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("storage error");
        });
        try {
            expect(loadBoard()).toBeNull();
        } finally {
            jest.restoreAllMocks();
        }
    });

    test("functions handle when localStorage throws on access", () => {
        const originalLocalStorage = Object.getOwnPropertyDescriptor(
            global,
            "localStorage"
        );

        Object.defineProperty(global, "localStorage", {
            get: () => {
                throw new Error("Access denied");
            },
            configurable: true,
        });

        try {
            expect(loadBoard()).toBeNull();
        } finally {
            if (originalLocalStorage) {
                Object.defineProperty(
                    global,
                    "localStorage",
                    originalLocalStorage
                );
            } else {
                delete (global as Record<string, unknown>).localStorage;
            }
        }
    });

    test("clearBoard removes the stored board", () => {
        saveBoard(new Map(), { x: 0, y: 0 }, 1);
        clearBoard();
        expect(loadBoard()).toBeNull();
    });
});
