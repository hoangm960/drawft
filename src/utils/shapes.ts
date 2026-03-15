import { Tools } from "../types";
import type { Point, Shape, BoundingBox } from "../types";

export const getBoundingBox = (shape: Shape): BoundingBox => ({
    from: {
        x: Math.min(shape.from.x, shape.to.x),
        y: Math.min(shape.from.y, shape.to.y),
    },
    to: {
        x: Math.max(shape.from.x, shape.to.x),
        y: Math.max(shape.from.y, shape.to.y),
    },
});

export const getBoundingBoxBounds = (box: BoundingBox) => ({
    minX: Math.min(box.from.x, box.to.x),
    maxX: Math.max(box.from.x, box.to.x),
    minY: Math.min(box.from.y, box.to.y),
    maxY: Math.max(box.from.y, box.to.y),
});

export const shapeIntersectsBox = (shape: Shape, box: BoundingBox): boolean => {
    const shapeBounds = getBoundingBoxBounds(getBoundingBox(shape));
    const boxBounds = getBoundingBoxBounds(box);
    return !(
        shapeBounds.maxX < boxBounds.minX ||
        shapeBounds.minX > boxBounds.maxX ||
        shapeBounds.maxY < boxBounds.minY ||
        shapeBounds.minY > boxBounds.maxY
    );
};

export const getShapePath = (shape: Shape): Path2D => {
    const { type, from, to } = shape;
    const path = new Path2D();

    switch (type) {
        case Tools.rect:
            drawRectangle(path, from, to);
            break;
        case Tools.dia:
            drawDiamond(path, from, to);
            break;
        case Tools.ellipse:
            drawEllipse(path, from, to);
            break;
        case Tools.arrow:
            drawArrow(path, from, to);
            break;
        case Tools.line:
            drawLine(path, from, to);
            break;
    }
    return path;
};

export const drawRectangle = (path: Path2D, from: Point, to: Point) => {
    path.rect(
        Math.min(from.x, to.x),
        Math.min(from.y, to.y),
        Math.abs(to.x - from.x),
        Math.abs(to.y - from.y)
    );
};

export const drawDiamond = (path: Path2D, from: Point, to: Point) => {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    path.moveTo(midX, minY);
    path.lineTo(maxX, midY);
    path.lineTo(midX, maxY);
    path.lineTo(minX, midY);
    path.closePath();
};

export const drawEllipse = (path: Path2D, from: Point, to: Point) => {
    path.ellipse(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
        Math.abs(to.x - from.x) / 2,
        Math.abs(to.y - from.y) / 2,
        0,
        0,
        2 * Math.PI
    );
};

export const drawArrow = (
    path: Path2D,
    from: Point,
    to: Point,
    headlen: number = 10
) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    path.moveTo(from.x, from.y);
    path.lineTo(to.x, to.y);
    path.lineTo(
        to.x - headlen * Math.cos(angle - Math.PI / 6),
        to.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    path.moveTo(to.x, to.y);
    path.lineTo(
        to.x - headlen * Math.cos(angle + Math.PI / 6),
        to.y - headlen * Math.sin(angle + Math.PI / 6)
    );
};

export const drawLine = (path: Path2D, from: Point, to: Point) => {
    path.moveTo(from.x, from.y);
    path.lineTo(to.x, to.y);
};
