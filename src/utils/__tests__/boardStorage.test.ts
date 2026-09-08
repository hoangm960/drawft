import { Tools } from "@/types";
import { makeShape } from "@/test/factories";
import {
    BOARD_STORAGE_KEY,
    clearBoard,
    loadBoard,
    saveBoard,
    serializeBoard,
} from "../boardStorage";

describe("boardStorage", () => {
    beforeEach(() => {
        localStorage.clear();
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

    test("clearBoard removes the stored board", () => {
        saveBoard(new Map(), { x: 0, y: 0 }, 1);
        clearBoard();
        expect(loadBoard()).toBeNull();
    });
});
