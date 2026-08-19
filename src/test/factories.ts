import { Tools, type BoundingBox, type Point, type Shape } from "@/types";

export type PathCall = {
    method: string;
    args: number[];
};

export const getCalls = (path: Path2D): PathCall[] =>
    (path as unknown as { calls: PathCall[] }).calls;

export const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect,
    props?: Partial<
        Pick<
            Shape,
            | "strokeWidth"
            | "strokeColor"
            | "strokePattern"
            | "fillColor"
            | "cornerRadius"
        >
    >
): Shape => ({ id, type, from, to, rotation: 0, ...props });

export const makeBBox = (from: Point, to: Point): BoundingBox => ({
    from,
    to,
});

export type MockHit = { inStroke: boolean; inPath: boolean };

export const createMockContext = (
    hit: MockHit = { inStroke: false, inPath: false }
) => ({
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    setLineDash: jest.fn(),
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    isPointInStroke: jest.fn(() => hit.inStroke),
    isPointInPath: jest.fn(() => hit.inPath),
});
