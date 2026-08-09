import { Tools, type BoundingBox, type Shape } from "@/types";
import {
    getBoundingBox,
    getBoundingBoxBounds,
    shapeIntersectsBox,
} from "../shapes";

describe("getBoundingBox", () => {
    test("returns correct box when from < to", () => {
        const shape: Shape = {
            id: 1,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };

        expect(getBoundingBox(shape)).toEqual({
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("normalize when from > to", () => {
        const shape: Shape = {
            id: 2,
            type: Tools.rect,
            from: { x: 200, y: 300 },
            to: { x: 100, y: 100 },
        };
        expect(getBoundingBox(shape)).toEqual({
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("handles negative coordinate", () => {
        const shape: Shape = {
            id: 3,
            type: Tools.rect,
            from: { x: -200, y: -300 },
            to: { x: -100, y: -100 },
        };
        expect(getBoundingBox(shape)).toEqual({
            from: { x: -200, y: -300 },
            to: { x: -100, y: -100 },
        });
    });

    test("handles zero-size shape", () => {
        const shape: Shape = {
            id: 4,
            type: Tools.rect,
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        };
        expect(getBoundingBox(shape)).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        });
    });
});

describe("getBoundingBoxBounds", () => {
    test("return normal bounds", () => {
        const box: BoundingBox = {
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        expect(getBoundingBoxBounds(box)).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });

    test("return the normal bounds when from > to", () => {
        const box: BoundingBox = {
            from: { x: 200, y: 300 },
            to: { x: 100, y: 100 },
        };
        expect(getBoundingBoxBounds(box)).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });
});

describe("shapeIntersectsBox", () => {
    test("return true when shape overlap box", () => {
        const shape = {
            id: 1,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 110, y: 120 },
        };
        expect(shapeIntersectsBox(shape, box)).toEqual(true);
    });

    test("return false when shape not overlap box", () => {
        const shape = {
            id: 2,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 90, y: 90 },
        };
        expect(shapeIntersectsBox(shape, box)).toEqual(false);
    });

    test("return true when shape touch edge of box", () => {
        const shape = {
            id: 3,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const box = {
            from: { x: 0, y: 100 },
            to: { x: 100, y: 100 },
        };
        expect(shapeIntersectsBox(shape, box)).toEqual(true);
    });

    test("return true when shape contains box", () => {
        const shape = {
            id: 4,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const box = {
            from: { x: 110, y: 110 },
            to: { x: 190, y: 290 },
        };
        expect(shapeIntersectsBox(shape, box)).toEqual(true);
    });

    test("return true when shape in box", () => {
        const shape = {
            id: 4,
            type: Tools.rect,
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const box = {
            from: { x: 90, y: 90 },
            to: { x: 210, y: 310 },
        };
        expect(shapeIntersectsBox(shape, box)).toEqual(true);
    });
});
