import type { PathCall } from "@/test/factories";

const getCalls = (path: unknown): PathCall[] =>
    (path as { calls?: PathCall[] }).calls ?? [];

const approx = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

const argsMatch = (actual: number[], expected: number[]): boolean =>
    actual.length === expected.length &&
    actual.every((value, index) => approx(value, expected[index]));

const makeMethodMatcher =
    (method: string, verb: string) =>
    (received: unknown, ...expected: number[]): jest.CustomMatcherResult => {
        const actual = getCalls(received)
            .filter(call => call.method === method)
            .map(call => call.args);
        const pass = actual.some(args => argsMatch(args, expected));
        const actualSummary =
            actual.length > 0
                ? actual.map(args => `[${args.join(", ")}]`).join(", ")
                : `no ${method} calls recorded`;
        return {
            pass,
            message: () =>
                `expected path ${pass ? "not " : ""}to ${verb}(${expected.join(
                    ", "
                )}) but got ${actualSummary}`,
        };
    };

const matchers = {
    toDrawRect: makeMethodMatcher("rect", "draw a rect"),
    toDrawRoundRect: makeMethodMatcher("roundRect", "draw a rounded rect"),
    toMoveTo: makeMethodMatcher("moveTo", "move to"),
    toLineTo: makeMethodMatcher("lineTo", "draw a line to"),
    toArcTo: makeMethodMatcher("arcTo", "draw an arc"),
    toDrawEllipse: makeMethodMatcher("ellipse", "draw an ellipse"),
    toClosePath(received: unknown): jest.CustomMatcherResult {
        const pass = getCalls(received).some(
            call => call.method === "closePath"
        );
        return {
            pass,
            message: () =>
                `expected path ${pass ? "not " : ""}to close the path`,
        };
    },
    toHaveArcRadius(
        received: unknown,
        radius: number
    ): jest.CustomMatcherResult {
        const radii = getCalls(received)
            .filter(call => call.method === "arcTo")
            .map(call => call.args[4]);
        const pass =
            radii.length > 0 && radii.every(value => approx(value, radius));
        return {
            pass,
            message: () =>
                `expected every arcTo ${pass ? "not " : ""}to use radius ${radius} but got [${radii.join(", ")}]`,
        };
    },
};

expect.extend(matchers);

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toDrawRect(x: number, y: number, w: number, h: number): R;
            toDrawRoundRect(
                x: number,
                y: number,
                w: number,
                h: number,
                radius: number
            ): R;
            toMoveTo(x: number, y: number): R;
            toLineTo(x: number, y: number): R;
            toArcTo(
                x1: number,
                y1: number,
                x2: number,
                y2: number,
                radius: number
            ): R;
            toDrawEllipse(
                cx: number,
                cy: number,
                rx: number,
                ry: number,
                rotation: number,
                startAngle: number,
                endAngle: number
            ): R;
            toClosePath(): R;
            toHaveArcRadius(radius: number): R;
        }
    }
}
