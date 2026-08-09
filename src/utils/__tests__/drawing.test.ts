import { Tools, type Point, type Shape } from "@/types";
import {
    drawArrow,
    drawDiamond,
    drawEllipse,
    drawLine,
    drawRectangle,
    getShapePath,
} from "../shapes";

type PathCall = {
    method: string;
    args: number[];
};

const getCalls = (path: Path2D): PathCall[] =>
    (path as unknown as { calls: PathCall[] }).calls;

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
            args: [100 - 10 * Math.cos(Math.PI / 6), 10 * Math.sin(Math.PI / 6)],
        });
        expect(calls[3]).toEqual({ method: "moveTo", args: [100, 0] });
        expect(calls[4]).toEqual({
            method: "lineTo",
            args: [100 - 10 * Math.cos(Math.PI / 6), -10 * Math.sin(Math.PI / 6)],
        });
    });

    test("respects custom headlen", () => {
        const path = new Path2D();
        drawArrow(path, { x: 0, y: 0 }, { x: 100, y: 0 }, 20);

        const calls = getCalls(path);
        expect(calls[2]).toEqual({
            method: "lineTo",
            args: [100 - 20 * Math.cos(Math.PI / 6), 20 * Math.sin(Math.PI / 6)],
        });
        expect(calls[4]).toEqual({
            method: "lineTo",
            args: [100 - 20 * Math.cos(Math.PI / 6), -20 * Math.sin(Math.PI / 6)],
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

describe("getShapePath", () => {
    const makeShape = (type: Tools, from: Point, to: Point): Shape => ({
        id: 1,
        type,
        from,
        to,
    });

    test("returns a Path2D instance", () => {
        const path = getShapePath(makeShape(Tools.rect, { x: 0, y: 0 }, { x: 10, y: 10 }));
        expect(path).toBeInstanceOf(Path2D);
    });

    test("dispatches rect to drawRectangle", () => {
        const path = getShapePath(makeShape(Tools.rect, { x: 0, y: 0 }, { x: 10, y: 10 }));
        expect(getCalls(path)).toEqual([
            { method: "rect", args: [0, 0, 10, 10] },
        ]);
    });

    test("dispatches dia to drawDiamond", () => {
        const path = getShapePath(makeShape(Tools.dia, { x: 0, y: 0 }, { x: 100, y: 100 }));
        expect(getCalls(path)[0]).toEqual({ method: "moveTo", args: [50, 0] });
        expect(getCalls(path)[4]).toEqual({ method: "closePath", args: [] });
    });

    test("dispatches ellipse to drawEllipse", () => {
        const path = getShapePath(makeShape(Tools.ellipse, { x: 0, y: 0 }, { x: 100, y: 50 }));
        expect(getCalls(path)).toEqual([
            { method: "ellipse", args: [50, 25, 50, 25, 0, 0, 2 * Math.PI] },
        ]);
    });

    test("dispatches arrow to drawArrow", () => {
        const path = getShapePath(makeShape(Tools.arrow, { x: 0, y: 0 }, { x: 100, y: 0 }));
        const calls = getCalls(path);
        expect(calls.filter(c => c.method === "lineTo")).toHaveLength(3);
    });

    test("dispatches line to drawLine", () => {
        const path = getShapePath(makeShape(Tools.line, { x: 0, y: 0 }, { x: 100, y: 200 }));
        expect(getCalls(path)).toEqual([
            { method: "moveTo", args: [0, 0] },
            { method: "lineTo", args: [100, 200] },
        ]);
    });
});
