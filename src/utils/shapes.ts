import { Tools } from "@/types";
import type {
    Point,
    Shape,
    BoundingBox,
    CornerHandle,
    ResizeHandle,
} from "@/types";

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

export const getCornerHandles = (
    box: BoundingBox
): Record<CornerHandle, Point> => {
    const { minX, maxX, minY, maxY } = getBoundingBoxBounds(box);

    return {
        nw: { x: minX, y: minY },
        ne: { x: maxX, y: minY },
        se: { x: maxX, y: maxY },
        sw: { x: minX, y: maxY },
    };
};

export const getBoundingBoxForShapes = (shapes: Shape[]): BoundingBox => {
    if (shapes.length === 0) {
        return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    }
    const bounds = shapes.map(shape =>
        getBoundingBoxBounds(getBoundingBox(shape))
    );
    return {
        from: {
            x: Math.min(...bounds.map(b => b.minX)),
            y: Math.min(...bounds.map(b => b.minY)),
        },
        to: {
            x: Math.max(...bounds.map(b => b.maxX)),
            y: Math.max(...bounds.map(b => b.maxY)),
        },
    };
};

const RESIZE_DIRS: Record<
    CornerHandle,
    Array<{ axis: "x" | "y"; edge: "min" | "max" }>
> = {
    nw: [
        { axis: "x", edge: "min" },
        { axis: "y", edge: "min" },
    ],
    ne: [
        { axis: "x", edge: "max" },
        { axis: "y", edge: "min" },
    ],
    se: [
        { axis: "x", edge: "max" },
        { axis: "y", edge: "max" },
    ],
    sw: [
        { axis: "x", edge: "min" },
        { axis: "y", edge: "max" },
    ],
};

export const resizeShapeFromHandle = (
    shape: Shape,
    handle: CornerHandle,
    point: Point
): { from: Point; to: Point } => {
    const { minX, minY, maxX, maxY } = getBoundingBoxBounds(
        getBoundingBox(shape)
    );
    const bounds = { x: { min: minX, max: maxX }, y: { min: minY, max: maxY } };
    const from = { ...shape.from };
    const to = { ...shape.to };

    for (const { axis, edge } of RESIZE_DIRS[handle]) {
        const endpoint = from[axis] === bounds[axis][edge] ? from : to;
        endpoint[axis] = point[axis];
    }

    return { from, to };
};

export const resizeShapesFromHandle = (
    shapes: Shape[],
    handle: ResizeHandle,
    point: Point
): Array<{ id: number; from: Point; to: Point }> => {
    if (handle === "from" || handle === "to") {
        const shape = shapes[0];
        return [
            {
                id: shape.id,
                from: handle === "from" ? { ...point } : { ...shape.from },
                to: handle === "to" ? { ...point } : { ...shape.to },
            },
        ];
    }

    const originalBox = getBoundingBoxForShapes(shapes);
    const originalBounds = getBoundingBoxBounds(originalBox);
    const newBox = resizeShapeFromHandle(
        {
            id: -1,
            type: Tools.rect,
            from: originalBox.from,
            to: originalBox.to,
        },
        handle,
        point
    );

    const oldWidth = originalBox.to.x - originalBox.from.x;
    const oldHeight = originalBox.to.y - originalBox.from.y;
    const sx = oldWidth === 0 ? 1 : (newBox.to.x - newBox.from.x) / oldWidth;
    const sy = oldHeight === 0 ? 1 : (newBox.to.y - newBox.from.y) / oldHeight;

    const anchor: Point =
        handle === "nw"
            ? { x: originalBounds.maxX, y: originalBounds.maxY }
            : handle === "ne"
              ? { x: originalBounds.minX, y: originalBounds.maxY }
              : handle === "se"
                ? { x: originalBounds.minX, y: originalBounds.minY }
                : { x: originalBounds.maxX, y: originalBounds.minY };

    return shapes.map(shape => ({
        id: shape.id,
        from: {
            x: anchor.x + (shape.from.x - anchor.x) * sx,
            y: anchor.y + (shape.from.y - anchor.y) * sy,
        },
        to: {
            x: anchor.x + (shape.to.x - anchor.x) * sx,
            y: anchor.y + (shape.to.y - anchor.y) * sy,
        },
    }));
};

export const getRotateHandle = (
    box: BoundingBox,
    topPadding: number
): Point => {
    const { minX, maxX, minY } = getBoundingBoxBounds(box);
    const midX = (minX + maxX) / 2;
    const rotateHandle = { x: midX, y: minY - topPadding };

    return rotateHandle;
};
