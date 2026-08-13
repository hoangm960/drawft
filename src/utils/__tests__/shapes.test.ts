import { Tools, type BoundingBox, type Point, type Shape } from "@/types";
import {
    drawArrow,
    drawDiamond,
    drawEllipse,
    drawLine,
    drawRectangle,
    getBoundingBox,
    getBoundingBoxBounds,
    getBoundingBoxForShapes,
    getCornerHandles,
    getShapePath,
    shapeIntersectsBox,
} from "../shapes";

type PathCall = {
    method: string;
    args: number[];
};

const getCalls = (path: Path2D): PathCall[] =>
    (path as unknown as { calls: PathCall[] }).calls;

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect
): Shape => ({ id, type, from, to });

const makeBBox = (from: Point, to: Point): BoundingBox => ({ from, to });

describe("getBoundingBox", () => {
    test("returns correct box when from < to", () => {
        expect(
            getBoundingBox(makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 }))
        ).toEqual({
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("normalizes when from > to", () => {
        expect(
            getBoundingBox(makeShape(2, { x: 200, y: 300 }, { x: 100, y: 100 }))
        ).toEqual({
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("handles negative coordinates", () => {
        expect(
            getBoundingBox(
                makeShape(3, { x: -200, y: -300 }, { x: -100, y: -100 })
            )
        ).toEqual({
            from: { x: -200, y: -300 },
            to: { x: -100, y: -100 },
        });
    });

    test("handles zero-size shape", () => {
        expect(
            getBoundingBox(makeShape(4, { x: 0, y: 0 }, { x: 0, y: 0 }))
        ).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        });
    });
});

describe("getBoundingBoxBounds", () => {
    test("returns normal bounds", () => {
        expect(
            getBoundingBoxBounds(
                makeBBox({ x: 100, y: 100 }, { x: 200, y: 300 })
            )
        ).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });

    test("returns normal bounds when from > to", () => {
        expect(
            getBoundingBoxBounds(
                makeBBox({ x: 200, y: 300 }, { x: 100, y: 100 })
            )
        ).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });
});

describe("shapeIntersectsBox", () => {
    const rect = makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 });

    test("returns true when shape overlaps box", () => {
        expect(
            shapeIntersectsBox(
                rect,
                makeBBox({ x: 0, y: 0 }, { x: 110, y: 120 })
            )
        ).toBe(true);
    });

    test("returns false when shape does not overlap box", () => {
        expect(
            shapeIntersectsBox(rect, makeBBox({ x: 0, y: 0 }, { x: 90, y: 90 }))
        ).toBe(false);
    });

    test("returns true when shape touches edge of box", () => {
        expect(
            shapeIntersectsBox(
                rect,
                makeBBox({ x: 0, y: 100 }, { x: 100, y: 100 })
            )
        ).toBe(true);
    });

    test("returns true when shape contains box", () => {
        expect(
            shapeIntersectsBox(
                rect,
                makeBBox({ x: 110, y: 110 }, { x: 190, y: 290 })
            )
        ).toBe(true);
    });

    test("returns true when shape is inside box", () => {
        expect(
            shapeIntersectsBox(
                rect,
                makeBBox({ x: 90, y: 90 }, { x: 210, y: 310 })
            )
        ).toBe(true);
    });
});

describe("drawRectangle", () => {
    test("draws rect with normalized origin and size", () => {
        const path = new Path2D();
        drawRectangle(path, { x: 100, y: 100 }, { x: 200, y: 300 });
        expect(getCalls(path)).toEqual([
            { method: "rect", args: [100, 100, 100, 200] },
        ]);
    });

    test("normalizes origin and size when from > to", () => {
        const path = new Path2D();
        drawRectangle(path, { x: 200, y: 300 }, { x: 100, y: 100 });
        expect(getCalls(path)).toEqual([
            { method: "rect", args: [100, 100, 100, 200] },
        ]);
    });
});

describe("drawDiamond", () => {
    test("draws diamond using midpoints", () => {
        const path = new Path2D();
        drawDiamond(path, { x: 0, y: 0 }, { x: 100, y: 100 });
        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [50, 0] },
            { method: "lineTo", args: [100, 50] },
            { method: "lineTo", args: [50, 100] },
            { method: "lineTo", args: [0, 50] },
            { method: "closePath", args: [] },
        ]);
    });

    test("draws diamond when from > to", () => {
        const path = new Path2D();
        drawDiamond(path, { x: 100, y: 100 }, { x: 0, y: 0 });
        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [50, 0] },
            { method: "lineTo", args: [100, 50] },
            { method: "lineTo", args: [50, 100] },
            { method: "lineTo", args: [0, 50] },
            { method: "closePath", args: [] },
        ]);
    });
});

describe("drawEllipse", () => {
    test("draws ellipse with center and radii", () => {
        const path = new Path2D();
        drawEllipse(path, { x: 0, y: 0 }, { x: 100, y: 50 });
        expect(getCalls(path)).toEqual([
            { method: "ellipse", args: [50, 25, 50, 25, 0, 0, 2 * Math.PI] },
        ]);
    });

    test("uses absolute radii when from > to", () => {
        const path = new Path2D();
        drawEllipse(path, { x: 100, y: 50 }, { x: 0, y: 0 });
        expect(getCalls(path)).toEqual([
            { method: "ellipse", args: [50, 25, 50, 25, 0, 0, 2 * Math.PI] },
        ]);
    });
});

describe("drawArrow", () => {
    test("draws line and arrowhead with default headlen", () => {
        const path = new Path2D();
        drawArrow(path, { x: 0, y: 0 }, { x: 100, y: 0 });

        const calls = getCalls(path);
        expect(calls[0]).toEqual({ method: "moveTo", args: [0, 0] });
        expect(calls[1]).toEqual({ method: "lineTo", args: [100, 0] });
        expect(calls[2]).toEqual({
            method: "lineTo",
            args: [
                100 - 10 * Math.cos(Math.PI / 6),
                10 * Math.sin(Math.PI / 6),
            ],
        });
        expect(calls[3]).toEqual({ method: "moveTo", args: [100, 0] });
        expect(calls[4]).toEqual({
            method: "lineTo",
            args: [
                100 - 10 * Math.cos(Math.PI / 6),
                -10 * Math.sin(Math.PI / 6),
            ],
        });
    });

    test("respects custom headlen", () => {
        const path = new Path2D();
        drawArrow(path, { x: 0, y: 0 }, { x: 100, y: 0 }, 20);

        const calls = getCalls(path);
        expect(calls[2]).toEqual({
            method: "lineTo",
            args: [
                100 - 20 * Math.cos(Math.PI / 6),
                20 * Math.sin(Math.PI / 6),
            ],
        });
        expect(calls[4]).toEqual({
            method: "lineTo",
            args: [
                100 - 20 * Math.cos(Math.PI / 6),
                -20 * Math.sin(Math.PI / 6),
            ],
        });
    });
});

describe("drawLine", () => {
    test("draws a single line from point to point", () => {
        const path = new Path2D();
        drawLine(path, { x: 0, y: 0 }, { x: 100, y: 200 });
        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 200] },
        ]);
    });
});

describe("getCornerHandles", () => {
    test("returns corner handles around the box", () => {
        expect(
            getCornerHandles(makeBBox({ x: 0, y: 0 }, { x: 100, y: 100 }))
        ).toEqual({
            nw: { x: 0, y: 0 },
            ne: { x: 100, y: 0 },
            se: { x: 100, y: 100 },
            sw: { x: 0, y: 100 },
        });
    });

    test("normalizes when from > to", () => {
        expect(
            getCornerHandles(makeBBox({ x: 100, y: 100 }, { x: 0, y: 0 }))
        ).toEqual({
            nw: { x: 0, y: 0 },
            ne: { x: 100, y: 0 },
            se: { x: 100, y: 100 },
            sw: { x: 0, y: 100 },
        });
    });
});

describe("getBoundingBoxForShapes", () => {
    test("returns the union box of multiple shapes", () => {
        expect(
            getBoundingBoxForShapes([
                makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
                makeShape(2, { x: 150, y: 150 }, { x: 200, y: 250 }),
            ])
        ).toEqual({ from: { x: 0, y: 0 }, to: { x: 200, y: 250 } });
    });

    test("returns the shape's box for a single shape", () => {
        expect(
            getBoundingBoxForShapes([
                makeShape(1, { x: 10, y: 20 }, { x: 30, y: 40 }),
            ])
        ).toEqual({ from: { x: 10, y: 20 }, to: { x: 30, y: 40 } });
    });

    test("returns a zero box for an empty selection", () => {
        expect(getBoundingBoxForShapes([])).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        });
    });
});

describe("getShapePath", () => {
    test("returns a Path2D instance", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 })
        );
        expect(path).toBeInstanceOf(Path2D);
    });

    test("dispatches rect to drawRectangle", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 })
        );
        expect(getCalls(path)).toEqual([
            { method: "rect", args: [0, 0, 10, 10] },
        ]);
    });

    test("dispatches dia to drawDiamond", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }, Tools.dia)
        );
        expect(getCalls(path)[0]).toEqual({ method: "moveTo", args: [50, 0] });
        expect(getCalls(path)[4]).toEqual({ method: "closePath", args: [] });
    });

    test("dispatches ellipse to drawEllipse", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 }, Tools.ellipse)
        );
        expect(getCalls(path)).toEqual([
            { method: "ellipse", args: [50, 25, 50, 25, 0, 0, 2 * Math.PI] },
        ]);
    });

    test("dispatches arrow to drawArrow", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 0 }, Tools.arrow)
        );
        const calls = getCalls(path);
        expect(calls.filter(c => c.method === "lineTo")).toHaveLength(3);
    });

    test("dispatches line to drawLine", () => {
        const path = getShapePath(
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 200 }, Tools.line)
        );
        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 200] },
        ]);
    });
});
