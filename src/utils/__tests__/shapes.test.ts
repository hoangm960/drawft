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
    getBoxCorners,
    getCornerHandles,
    getFrameRotateHandle,
    getPointAngle,
    getRotateDeltaAngle,
    getRotateHandle,
    getRotationCenter,
    getRotatedCorners,
    getShapeCenter,
    getShapePath,
    resizeShapeFromHandle,
    resizeShapesFromHandle,
    rotatePoint,
    rotateShapesFromCenter,
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
): Shape => ({ id, type, from, to, rotation: 0 });

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

describe("resizeShapeFromHandle", () => {
    const rect = (): Shape => makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 });

    test("se handle moves both max edges", () => {
        expect(resizeShapeFromHandle(rect(), "se", { x: 150, y: 150 })).toEqual(
            {
                from: { x: 0, y: 0 },
                to: { x: 150, y: 150 },
            }
        );
    });

    test("nw handle moves both min edges", () => {
        expect(resizeShapeFromHandle(rect(), "nw", { x: -50, y: -50 })).toEqual(
            {
                from: { x: -50, y: -50 },
                to: { x: 100, y: 100 },
            }
        );
    });

    test("moves the from endpoint when it holds the dragged edge", () => {
        expect(
            resizeShapeFromHandle(
                makeShape(1, { x: 100, y: 100 }, { x: 0, y: 0 }),
                "se",
                { x: 150, y: 150 }
            )
        ).toEqual({
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

        expect(resizeShapeFromHandle(arrow, "se", { x: 50, y: 0 })).toEqual({
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

        expect(resizeShapeFromHandle(arrow, "sw", { x: -50, y: 0 })).toEqual({
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

        expect(
            resizeShapesFromHandle([arrow], "from", { x: -50, y: 0 })
        ).toEqual([
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

        expect(resizeShapesFromHandle([arrow], "to", { x: 150, y: 0 })).toEqual(
            [
                {
                    id: 1,
                    from: { x: 0, y: 0 },
                    to: { x: 150, y: 0 },
                },
            ]
        );
    });

    test("scales multiple shapes around the anchor corner", () => {
        const shapes = [
            makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
            makeShape(2, { x: 150, y: 150 }, { x: 200, y: 200 }),
        ];

        expect(
            resizeShapesFromHandle(shapes, "se", { x: 300, y: 300 })
        ).toEqual([
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

        expect(
            resizeShapesFromHandle(shapes, "se", { x: -50, y: -50 })
        ).toEqual([
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

describe("getBoxCorners", () => {
    test("returns corners in clockwise order", () => {
        expect(
            getBoxCorners(makeBBox({ x: 0, y: 0 }, { x: 100, y: 100 }))
        ).toEqual([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ]);
    });

    test("uses the box coordinates as given without normalizing", () => {
        expect(
            getBoxCorners(makeBBox({ x: 100, y: 100 }, { x: 0, y: 0 }))
        ).toEqual([
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]);
    });
});

describe("getRotatedCorners", () => {
    test("returns the unrotated corners when rotation is zero", () => {
        expect(
            getRotatedCorners(makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }))
        ).toEqual([
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
        expect(
            getShapeCenter(makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 }))
        ).toEqual({ x: 50, y: 25 });
    });

    test("works when from and to are reversed", () => {
        expect(
            getShapeCenter(makeShape(1, { x: 100, y: 50 }, { x: 0, y: 0 }))
        ).toEqual({ x: 50, y: 25 });
    });
});

describe("rotatePoint", () => {
    test("rotates a point 90 degrees counterclockwise", () => {
        const point = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
        expect(point.x).toBeCloseTo(0);
        expect(point.y).toBeCloseTo(10);
    });

    test("keeps a point on the center unchanged", () => {
        expect(rotatePoint({ x: 5, y: 5 }, { x: 5, y: 5 }, Math.PI)).toEqual({
            x: 5,
            y: 5,
        });
    });

    test("rotates around a non-origin center", () => {
        const point = rotatePoint({ x: 10, y: 0 }, { x: 5, y: 0 }, Math.PI);
        expect(point.x).toBeCloseTo(0);
        expect(point.y).toBeCloseTo(0);
    });
});

describe("getPointAngle", () => {
    test("returns 0 for a point to the right of center", () => {
        expect(getPointAngle({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
    });

    test("returns PI/2 for a point below center", () => {
        expect(getPointAngle({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
            Math.PI / 2
        );
    });

    test("returns PI for a point to the left of center", () => {
        expect(getPointAngle({ x: 0, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(
            Math.PI
        );
    });
});

describe("getRotateDeltaAngle", () => {
    test("returns the clockwise angle between the two points", () => {
        expect(
            getRotateDeltaAngle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 })
        ).toBeCloseTo(Math.PI / 2);
    });
});

describe("getRotateHandle", () => {
    test("places the handle above the top edge midpoint", () => {
        expect(
            getRotateHandle(makeBBox({ x: 0, y: 0 }, { x: 100, y: 50 }), 50)
        ).toEqual({ x: 50, y: -50 });
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
        expect(getFrameRotateHandle(corners, 0, 50)).toEqual({
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
        const handle = getFrameRotateHandle(corners, Math.PI / 2, 50);
        expect(handle.x).toBeCloseTo(150);
        expect(handle.y).toBeCloseTo(50);
    });
});

describe("getRotationCenter", () => {
    test("returns the center of the union bounding box", () => {
        expect(
            getRotationCenter([
                makeShape(1, { x: 0, y: 0 }, { x: 100, y: 100 }),
                makeShape(2, { x: 200, y: 0 }, { x: 300, y: 100 }),
            ])
        ).toEqual({ x: 150, y: 50 });
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
