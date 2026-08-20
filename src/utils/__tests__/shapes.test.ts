import { Tools, type Shape } from "@/types";
import { getCalls, makeBBox, makeShape } from "@/test/factories";
import {
    DEFAULT_STROKE,
    STROKE_PATTERNS,
    drawArrow,
    drawDiamond,
    drawEllipse,
    drawLine,
    drawRectangle,
    getBoundingBox,
    getBoundingBoxBounds,
    getBoundingBoxForShapes,
    getBoxCorners,
    getFrameRotateHandle,
    getPointAngle,
    getRotateDeltaAngle,
    getRotationCenter,
    getRotatedCorners,
    getShapeCenter,
    getShapePath,
    getStrokeDash,
    getStrokeDashScaled,
    resizeShapeFromHandle,
    resizeShapesFromHandle,
    rotatePoint,
    rotateShapesFromCenter,
} from "../shapes";

describe("getBoundingBox", () => {
    test("returns correct box when from < to", () => {
        const box = {
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const shape = makeShape(1, box.from, box.to);

        expect(getBoundingBox(shape)).toEqual(box);
    });

    test("normalizes when from > to", () => {
        const box = {
            from: { x: 200, y: 300 },
            to: { x: 100, y: 100 },
        };
        const shape = makeShape(2, box.from, box.to);

        expect(getBoundingBox(shape)).toEqual({
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        });
    });

    test("handles negative coordinates", () => {
        const box = {
            from: { x: -200, y: -300 },
            to: { x: -100, y: -100 },
        };
        const shape = makeShape(3, box.from, box.to);

        expect(getBoundingBox(shape)).toEqual({
            from: { x: -200, y: -300 },
            to: { x: -100, y: -100 },
        });
    });

    test("handles zero-size shape", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        };
        const shape = makeShape(4, box.from, box.to);

        expect(getBoundingBox(shape)).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        });
    });
});

describe("getBoundingBoxBounds", () => {
    test("returns normal bounds", () => {
        const box = makeBBox({ x: 100, y: 100 }, { x: 200, y: 300 });

        expect(getBoundingBoxBounds(box)).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });

    test("returns normal bounds when from > to", () => {
        const box = makeBBox({ x: 200, y: 300 }, { x: 100, y: 100 });

        expect(getBoundingBoxBounds(box)).toEqual({
            minX: 100,
            maxX: 200,
            minY: 100,
            maxY: 300,
        });
    });
});

describe("drawRectangle", () => {
    test("draws rect with normalized origin and size", () => {
        const box = {
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to, 0);

        expect(getCalls(path)).toEqual([
            { method: "rect", args: [100, 100, 100, 200] },
        ]);
    });

    test("normalizes origin and size when from > to", () => {
        const box = {
            from: { x: 200, y: 300 },
            to: { x: 100, y: 100 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to, 0);

        expect(getCalls(path)).toEqual([
            { method: "rect", args: [100, 100, 100, 200] },
        ]);
    });

    test("uses the default corner radius when none is given", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 200 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to);

        expect(getCalls(path)).toEqual([
            { method: "roundRect", args: [0, 0, 100, 200, 20] },
        ]);
    });

    test("rounds corners with roundRect when a radius is given", () => {
        const box = {
            from: { x: 100, y: 100 },
            to: { x: 200, y: 300 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to, 10);

        expect(getCalls(path)).toEqual([
            { method: "roundRect", args: [100, 100, 100, 200, 10] },
        ]);
    });

    test("clamps the radius to half the smallest side", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 200 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to, 100);

        expect(getCalls(path)).toEqual([
            { method: "roundRect", args: [0, 0, 100, 200, 50] },
        ]);
    });

    test("treats a negative radius as no rounding", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 200 },
        };
        const path = new Path2D();
        drawRectangle(path, box.from, box.to, -5);

        expect(getCalls(path)).toEqual([
            { method: "rect", args: [0, 0, 100, 200] },
        ]);
    });
});

describe("drawDiamond", () => {
    test("draws diamond using midpoints", () => {
        const MIDPOINT = 50;
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 100 },
        };
        const path = new Path2D();
        drawDiamond(path, box.from, box.to, 0);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [MIDPOINT, 0] },
            { method: "lineTo", args: [100, MIDPOINT] },
            { method: "lineTo", args: [MIDPOINT, 100] },
            { method: "lineTo", args: [0, MIDPOINT] },
            { method: "closePath", args: [] },
        ]);
    });

    test("draws diamond when from > to", () => {
        const MIDPOINT = 50;
        const box = {
            from: { x: 100, y: 100 },
            to: { x: 0, y: 0 },
        };
        const path = new Path2D();
        drawDiamond(path, box.from, box.to, 0);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [MIDPOINT, 0] },
            { method: "lineTo", args: [100, MIDPOINT] },
            { method: "lineTo", args: [MIDPOINT, 100] },
            { method: "lineTo", args: [0, MIDPOINT] },
            { method: "closePath", args: [] },
        ]);
    });

    test("rounds corners with arcTo when a radius is given", () => {
        const MIDPOINT = 50;
        const HALF_EDGE = 50;
        const RADIUS = 10;
        const EDGE = Math.hypot(HALF_EDGE, HALF_EDGE);
        const INSET = (RADIUS / EDGE) * HALF_EDGE;
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 100 },
        };
        const path = new Path2D();
        drawDiamond(path, box.from, box.to, RADIUS);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [MIDPOINT - INSET, INSET] },
            {
                method: "arcTo",
                args: [MIDPOINT, 0, MIDPOINT + INSET, INSET, RADIUS],
            },
            {
                method: "arcTo",
                args: [100, MIDPOINT, 100 - INSET, MIDPOINT + INSET, RADIUS],
            },
            {
                method: "arcTo",
                args: [MIDPOINT, 100, MIDPOINT - INSET, 100 - INSET, RADIUS],
            },
            {
                method: "arcTo",
                args: [0, MIDPOINT, INSET, MIDPOINT - INSET, RADIUS],
            },
            { method: "closePath", args: [] },
        ]);
    });

    test("clamps the radius to half an edge", () => {
        const HALF_EDGE = 50;
        const EDGE = Math.hypot(HALF_EDGE, HALF_EDGE);
        const CLAMPED_RADIUS = EDGE / 2;
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 100 },
        };
        const path = new Path2D();
        drawDiamond(path, box.from, box.to, 100);

        const arcRadii = getCalls(path)
            .filter(call => call.method === "arcTo")
            .map(call => call.args[4]);
        expect(arcRadii).toHaveLength(4);
        expect(arcRadii.every(value => value === CLAMPED_RADIUS)).toBe(true);
    });

    test("treats a negative radius as no rounding", () => {
        const MIDPOINT = 50;
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 100 },
        };
        const path = new Path2D();
        drawDiamond(path, box.from, box.to, -5);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [MIDPOINT, 0] },
            { method: "lineTo", args: [100, MIDPOINT] },
            { method: "lineTo", args: [MIDPOINT, 100] },
            { method: "lineTo", args: [0, MIDPOINT] },
            { method: "closePath", args: [] },
        ]);
    });
});

describe("drawEllipse", () => {
    test("draws ellipse with center and radii", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 50 },
        };
        const path = new Path2D();
        drawEllipse(path, box.from, box.to);

        expect(getCalls(path)).toEqual([
            {
                method: "ellipse",
                args: [50, 25, 50, 25, 0, 0, 2 * Math.PI],
            },
        ]);
    });

    test("uses absolute radii when from > to", () => {
        const box = {
            from: { x: 100, y: 50 },
            to: { x: 0, y: 0 },
        };
        const path = new Path2D();
        drawEllipse(path, box.from, box.to);

        expect(getCalls(path)).toEqual([
            {
                method: "ellipse",
                args: [50, 25, 50, 25, 0, 0, 2 * Math.PI],
            },
        ]);
    });
});

describe("drawArrow", () => {
    test("draws line and arrowhead with default headlen", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 0 },
        };
        const path = new Path2D();
        drawArrow(path, box.from, box.to);
        const shaft = 10 * Math.cos(Math.PI / 6);
        const wing = 10 * Math.sin(Math.PI / 6);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, wing] },
            { method: "moveTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, -wing] },
        ]);
    });

    test("respects custom headlen", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 0 },
        };
        const path = new Path2D();
        drawArrow(path, box.from, box.to, 20);
        const shaft = 20 * Math.cos(Math.PI / 6);
        const wing = 20 * Math.sin(Math.PI / 6);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, wing] },
            { method: "moveTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, -wing] },
        ]);
    });
});

describe("drawLine", () => {
    test("draws a single line from point to point", () => {
        const box = {
            from: { x: 0, y: 0 },
            to: { x: 100, y: 200 },
        };
        const path = new Path2D();
        drawLine(path, box.from, box.to);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 200] },
        ]);
    });
});

describe("getBoundingBoxForShapes", () => {
    test("returns the union box of multiple shapes", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
            makeShape(2, { x: 150, y: 150 }, { x: 200, y: 250 }),
        ];

        expect(getBoundingBoxForShapes(shapes)).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 200, y: 250 },
        });
    });

    test("returns the shape's box for a single shape", () => {
        const shapes = [makeShape(1, { x: 10, y: 20 }, { x: 30, y: 40 })];

        expect(getBoundingBoxForShapes(shapes)).toEqual({
            from: { x: 10, y: 20 },
            to: { x: 30, y: 40 },
        });
    });

    test("returns a zero box for an empty selection", () => {
        const shapes: Shape[] = [];

        expect(getBoundingBoxForShapes(shapes)).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
        });
    });
});

describe("resizeShapeFromHandle", () => {
    const rect = (): Shape => makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 });

    test("se handle moves both max edges", () => {
        const result = resizeShapeFromHandle(rect(), "se", { x: 150, y: 150 });

        expect(result).toEqual({
            from: { x: 0, y: 0 },
            to: { x: 150, y: 150 },
        });
    });

    test("nw handle moves both min edges", () => {
        const result = resizeShapeFromHandle(rect(), "nw", { x: -50, y: -50 });

        expect(result).toEqual({
            from: { x: -50, y: -50 },
            to: { x: 100, y: 100 },
        });
    });

    test("moves the from endpoint when it holds the dragged edge", () => {
        const shape = makeShape(1, { x: 100, y: 100 }, { x: 0, y: 0 });
        const result = resizeShapeFromHandle(shape, "se", { x: 150, y: 150 });

        expect(result).toEqual({
            from: { x: 150, y: 150 },
            to: { x: 0, y: 0 },
        });
    });

    test("preserves arrow direction when resizing the tail corner", () => {
        const arrow = makeShape(
            1,
            { x: 100, y: 0 },
            { x: 0, y: 0 },
            Tools.arrow
        );
        const result = resizeShapeFromHandle(arrow, "se", { x: 50, y: 0 });

        expect(result).toEqual({
            from: { x: 50, y: 0 },
            to: { x: 0, y: 0 },
        });
    });

    test("preserves arrow direction when resizing the head corner", () => {
        const arrow = makeShape(
            1,
            { x: 100, y: 0 },
            { x: 0, y: 0 },
            Tools.arrow
        );
        const result = resizeShapeFromHandle(arrow, "sw", { x: -50, y: 0 });

        expect(result).toEqual({
            from: { x: 100, y: 0 },
            to: { x: -50, y: 0 },
        });
    });
});

describe("resizeShapesFromHandle", () => {
    test("from handle moves only the from endpoint", () => {
        const arrow = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            Tools.arrow
        );
        const result = resizeShapesFromHandle([arrow], "from", {
            x: -50,
            y: 0,
        });

        expect(result).toEqual([
            {
                id: 1,
                from: { x: -50, y: 0 },
                to: { x: 100, y: 0 },
            },
        ]);
    });

    test("to handle moves only the to endpoint", () => {
        const arrow = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            Tools.arrow
        );
        const result = resizeShapesFromHandle([arrow], "to", { x: 150, y: 0 });

        expect(result).toEqual([
            {
                id: 1,
                from: { x: 0, y: 0 },
                to: { x: 150, y: 0 },
            },
        ]);
    });

    test("scales multiple shapes around the anchor corner", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
            makeShape(2, { x: 150, y: 150 }, { x: 200, y: 200 }),
        ];
        const result = resizeShapesFromHandle(shapes, "se", { x: 300, y: 300 });

        expect(result).toEqual([
            {
                id: 1,
                from: { x: 0, y: 0 },
                to: { x: 150, y: 150 },
            },
            {
                id: 2,
                from: { x: 225, y: 225 },
                to: { x: 300, y: 300 },
            },
        ]);
    });

    test("mirrors the selection when dragging past the anchor", () => {
        const shapes = [makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 })];
        const result = resizeShapesFromHandle(shapes, "se", { x: -50, y: -50 });

        expect(result).toEqual([
            {
                id: 1,
                from: { x: 0, y: 0 },
                to: { x: -50, y: -50 },
            },
        ]);
    });

    test("keeps arrow direction when group-scaling", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 }, Tools.arrow),
        ];

        const resized = resizeShapesFromHandle(shapes, "se", {
            x: 200,
            y: 100,
        });
        expect(resized[0].from).toEqual({ x: 0, y: 0 });
        expect(resized[0].to).toEqual({ x: 200, y: 100 });
    });
});

describe("getShapePath", () => {
    test("returns a Path2D instance", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        const path = getShapePath(shape);

        expect(path).toBeInstanceOf(Path2D);
    });

    test("dispatches rect to drawRectangle", () => {
        const shape = {
            ...makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }),
            cornerRadius: 0,
        };
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            { method: "rect", args: [0, 0, 10, 10] },
        ]);
    });

    test("applies the default corner radius to a rect", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 200 });
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            { method: "roundRect", args: [0, 0, 100, 200, 20] },
        ]);
    });

    test("forwards cornerRadius to drawRectangle", () => {
        const shape = {
            ...makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }),
            cornerRadius: 5,
        };
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            { method: "roundRect", args: [0, 0, 10, 10, 5] },
        ]);
    });

    test("forwards cornerRadius to drawDiamond", () => {
        const shape = {
            ...makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }, Tools.dia),
            cornerRadius: 10,
        };
        const path = getShapePath(shape);
        const HALF_EDGE = 50;
        const EDGE = Math.hypot(HALF_EDGE, HALF_EDGE);
        const INSET = (10 / EDGE) * HALF_EDGE;

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [HALF_EDGE - INSET, INSET] },
            {
                method: "arcTo",
                args: [HALF_EDGE, 0, HALF_EDGE + INSET, INSET, 10],
            },
            {
                method: "arcTo",
                args: [100, HALF_EDGE, 100 - INSET, HALF_EDGE + INSET, 10],
            },
            {
                method: "arcTo",
                args: [HALF_EDGE, 100, HALF_EDGE - INSET, 100 - INSET, 10],
            },
            {
                method: "arcTo",
                args: [0, HALF_EDGE, INSET, HALF_EDGE - INSET, 10],
            },
            { method: "closePath", args: [] },
        ]);
    });

    test("dispatches dia to drawDiamond", () => {
        const shape = {
            ...makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }, Tools.dia),
            cornerRadius: 0,
        };
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [50, 0] },
            { method: "lineTo", args: [100, 50] },
            { method: "lineTo", args: [50, 100] },
            { method: "lineTo", args: [0, 50] },
            { method: "closePath", args: [] },
        ]);
    });

    test("dispatches ellipse to drawEllipse", () => {
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 100, y: 50 },
            Tools.ellipse
        );
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            {
                method: "ellipse",
                args: [50, 25, 50, 25, 0, 0, 2 * Math.PI],
            },
        ]);
    });

    test("dispatches arrow to drawArrow", () => {
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            Tools.arrow
        );
        const path = getShapePath(shape);
        const shaft = 10 * Math.cos(Math.PI / 6);
        const wing = 10 * Math.sin(Math.PI / 6);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, wing] },
            { method: "moveTo", args: [100, 0] },
            { method: "lineTo", args: [100 - shaft, -wing] },
        ]);
    });

    test("dispatches line to drawLine", () => {
        const shape = makeShape(
            1,
            { x: 0, y: 0 },
            { x: 100, y: 200 },
            Tools.line
        );
        const path = getShapePath(shape);

        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 200] },
        ]);
    });
});

describe("getBoxCorners", () => {
    test("returns corners in clockwise order", () => {
        const box = makeBBox({ x: 0, y: 0 }, { x: 100, y: 100 });

        expect(getBoxCorners(box)).toEqual([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ]);
    });

    test("uses the box coordinates as given without normalizing", () => {
        const box = makeBBox({ x: 100, y: 100 }, { x: 0, y: 0 });

        expect(getBoxCorners(box)).toEqual([
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]);
    });
});

describe("getRotatedCorners", () => {
    test("returns the unrotated corners when rotation is zero", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 });

        expect(getRotatedCorners(shape)).toEqual([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ]);
    });

    test("rotates the corners around the shape center", () => {
        const rotated = getRotatedCorners({
            ...makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
            rotation: Math.PI / 2,
        });
        expect(rotated[0].x).toBeCloseTo(100);
        expect(rotated[0].y).toBeCloseTo(0);
        expect(rotated[1].x).toBeCloseTo(100);
        expect(rotated[1].y).toBeCloseTo(100);
        expect(rotated[2].x).toBeCloseTo(0);
        expect(rotated[2].y).toBeCloseTo(100);
        expect(rotated[3].x).toBeCloseTo(0);
        expect(rotated[3].y).toBeCloseTo(0);
    });
});

describe("getShapeCenter", () => {
    test("returns the midpoint of from and to", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 });

        expect(getShapeCenter(shape)).toEqual({ x: 50, y: 25 });
    });

    test("works when from and to are reversed", () => {
        const shape = makeShape(1, { x: 100, y: 50 }, { x: 0, y: 0 });

        expect(getShapeCenter(shape)).toEqual({ x: 50, y: 25 });
    });
});

describe("rotatePoint", () => {
    test("rotates a point 90 degrees counterclockwise", () => {
        const point = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
        expect(point.x).toBeCloseTo(0);
        expect(point.y).toBeCloseTo(10);
    });

    test("keeps a point on the center unchanged", () => {
        const center = { x: 5, y: 5 };
        const point = rotatePoint(center, center, Math.PI);

        expect(point).toEqual({
            x: 5,
            y: 5,
        });
    });

    test("rotates around a non-origin center", () => {
        const center = { x: 5, y: 0 };
        const point = rotatePoint({ x: 10, y: 0 }, center, Math.PI);
        expect(point.x).toBeCloseTo(0);
        expect(point.y).toBeCloseTo(0);
    });
});

describe("getPointAngle", () => {
    test("returns 0 for a point to the right of center", () => {
        const center = { x: 0, y: 0 };
        const point = { x: 1, y: 0 };

        expect(getPointAngle(center, point)).toBeCloseTo(0);
    });

    test("returns PI/2 for a point below center", () => {
        const center = { x: 0, y: 0 };
        const point = { x: 0, y: 1 };

        expect(getPointAngle(center, point)).toBeCloseTo(Math.PI / 2);
    });

    test("returns PI for a point to the left of center", () => {
        const center = { x: 0, y: 0 };
        const point = { x: -1, y: 0 };

        expect(getPointAngle(center, point)).toBeCloseTo(Math.PI);
    });
});

describe("getRotateDeltaAngle", () => {
    test("returns the clockwise angle between the two points", () => {
        const center = { x: 0, y: 0 };
        const from = { x: 1, y: 0 };
        const to = { x: 0, y: 1 };

        expect(getRotateDeltaAngle(center, from, to)).toBeCloseTo(Math.PI / 2);
    });
});

describe("getFrameRotateHandle", () => {
    test("places the handle above the frame for zero rotation", () => {
        const corners = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ];

        expect(getFrameRotateHandle(corners, 0)).toEqual({
            x: 50,
            y: -50,
        });
    });

    test("offsets perpendicular to the rotated top edge", () => {
        const corners = [
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 },
        ];
        const handle = getFrameRotateHandle(corners, Math.PI / 2);
        expect(handle.x).toBeCloseTo(150);
        expect(handle.y).toBeCloseTo(50);
    });
});

describe("getRotationCenter", () => {
    test("returns the center of the union bounding box", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
            makeShape(2, { x: 200, y: 0 }, { x: 300, y: 100 }),
        ];

        expect(getRotationCenter(shapes)).toEqual({ x: 150, y: 50 });
    });
});

describe("getBoundingBox with rotation", () => {
    test("expands the box to cover the rotated corners", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 });
        const box = getBoundingBox({
            ...shape,
            rotation: Math.PI / 2,
        });

        expect(box.from.x).toBeCloseTo(25);
        expect(box.from.y).toBeCloseTo(-25);
        expect(box.to.x).toBeCloseTo(75);
        expect(box.to.y).toBeCloseTo(75);
    });
});

describe("rotateShapesFromCenter", () => {
    test("rotates a single shape around the given center", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 });
        const result = rotateShapesFromCenter(
            [shape],
            { x: 0, y: 0 },
            Math.PI / 2
        )[0];

        expect(result.from.x).toBeCloseTo(-100);
        expect(result.from.y).toBeCloseTo(0);
        expect(result.to.x).toBeCloseTo(0);
        expect(result.to.y).toBeCloseTo(100);
        expect(result.rotation).toBeCloseTo(Math.PI / 2);
    });

    test("rotates and translates multiple shapes together", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }),
            makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }),
        ];
        const result = rotateShapesFromCenter(
            shapes,
            { x: 0, y: 0 },
            Math.PI / 2
        );

        expect(result[0].from.x).toBeCloseTo(-10);
        expect(result[0].from.y).toBeCloseTo(0);
        expect(result[0].to.x).toBeCloseTo(0);
        expect(result[0].to.y).toBeCloseTo(10);
        expect(result[1].from.x).toBeCloseTo(-30);
        expect(result[1].from.y).toBeCloseTo(20);
        expect(result[1].to.x).toBeCloseTo(-20);
        expect(result[1].to.y).toBeCloseTo(30);
        expect(result.map(r => r.rotation)).toEqual([Math.PI / 2, Math.PI / 2]);
    });

    test("keeps a shape stationary when rotating around its own center", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 });
        const result = rotateShapesFromCenter(
            [shape],
            { x: 50, y: 50 },
            Math.PI / 2
        )[0];

        expect(result.from).toEqual({ x: 0, y: 0 });
        expect(result.to).toEqual({ x: 100, y: 100 });
        expect(result.rotation).toBeCloseTo(Math.PI / 2);
    });
});

describe("stroke helpers", () => {
    test.each([
        ["solid", STROKE_PATTERNS.solid],
        ["dashed", [8, 8]],
        ["dotted", [2, 6]],
    ] as const)("maps the %s pattern to a dash array", (pattern, expected) => {
        expect(getStrokeDash(pattern)).toEqual(expected);
    });

    test.each([
        ["dashed", 2, [4, 4]],
        ["dotted", 0.5, [4, 12]],
    ] as const)(
        "scales the %s pattern dash lengths by the zoom scale %d",
        (pattern, scale, expected) => {
            expect(getStrokeDashScaled(pattern, scale)).toEqual(expected);
        }
    );

    test("falls back to the default solid pattern when undefined", () => {
        expect(getStrokeDashScaled(undefined, 1)).toEqual(
            STROKE_PATTERNS[DEFAULT_STROKE.strokePattern]
        );
    });
});
