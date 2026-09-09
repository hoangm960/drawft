import { useCallback } from "react";
import {
    getBoundingBoxForShapes,
    getShapeCenter,
    getShapePath,
    getStrokeDashScaled,
} from "@/utils/shapes";
import {
    DEFAULT_FILL,
    DEFAULT_OPACITY,
    DEFAULT_STROKE,
    HANDLE_SIZE,
} from "@/constants";
import type { Shape, Handles, Point, BoundingBox } from "@/types";

export function useCanvasDraw(
    shapes: Map<number, Shape>,
    currentShape: Shape | null,
    selectedShapes: Shape[],
    selectionHandles: Partial<Record<Handles, Point>> | null,
    isSingleLineLike: boolean,
    isRotating: boolean,
    selectionBox: BoundingBox | null,
    offset: Point,
    scale: number,
    themeDefaultStrokeColor: string
) {
    const draw = useCallback(
        (canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);
            ctx.clearRect(
                -offset.x / scale,
                -offset.y / scale,
                canvas.width / scale,
                canvas.height / scale
            );

            const drawShape = (shape: Shape) => {
                const path = getShapePath(shape);

                ctx.save();
                if (shape.rotation !== 0) {
                    const center = getShapeCenter(shape);
                    ctx.translate(center.x, center.y);
                    ctx.rotate(shape.rotation);
                    ctx.translate(-center.x, -center.y);
                }
                ctx.globalAlpha = shape.opacity ?? DEFAULT_OPACITY;
                ctx.strokeStyle = shape.strokeColor ?? themeDefaultStrokeColor;
                ctx.fillStyle = shape.fillColor ?? DEFAULT_FILL.fillColor;
                ctx.lineWidth =
                    (shape.strokeWidth ?? DEFAULT_STROKE.strokeWidth) / scale;
                ctx.setLineDash(
                    getStrokeDashScaled(
                        shape.strokePattern ?? DEFAULT_STROKE.strokePattern,
                        scale
                    )
                );
                ctx.fill(path);
                ctx.stroke(path);
                ctx.restore();
            };

            shapes.forEach(shape => {
                drawShape(shape);
            });

            if (currentShape) {
                drawShape(currentShape);
            }

            if (selectionHandles) {
                const handleSize = HANDLE_SIZE / scale;

                if (!isSingleLineLike && !isRotating) {
                    ctx.strokeStyle = "purple";
                    ctx.fillStyle = "transparent";
                    ctx.lineWidth = 1 / scale;
                    ctx.setLineDash([4 / scale, 4 / scale]);

                    if (
                        selectedShapes.length === 1 &&
                        selectedShapes[0].rotation !== 0
                    ) {
                        const shape = selectedShapes[0];
                        const center = getShapeCenter(shape);
                        ctx.save();
                        ctx.translate(center.x, center.y);
                        ctx.rotate(shape.rotation);
                        ctx.translate(-center.x, -center.y);
                        ctx.strokeRect(
                            Math.min(shape.from.x, shape.to.x),
                            Math.min(shape.from.y, shape.to.y),
                            Math.abs(shape.to.x - shape.from.x),
                            Math.abs(shape.to.y - shape.from.y)
                        );
                        ctx.restore();
                    } else {
                        const box = getBoundingBoxForShapes(selectedShapes);
                        ctx.strokeRect(
                            box.from.x,
                            box.from.y,
                            box.to.x - box.from.x,
                            box.to.y - box.from.y
                        );
                    }

                    ctx.setLineDash([]);
                }

                if (!isRotating) {
                    ctx.fillStyle = "white";
                    ctx.strokeStyle = "purple";
                    ctx.lineWidth = 1 / scale;
                    for (const point of Object.values(selectionHandles)) {
                        if (!point) continue;
                        const x = point.x - handleSize / 2;
                        const y = point.y - handleSize / 2;
                        ctx.fillRect(x, y, handleSize, handleSize);
                        ctx.strokeRect(x, y, handleSize, handleSize);
                    }
                }
            }

            if (selectionBox) {
                const { from, to } = selectionBox;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                const screenFrom = {
                    x: from.x * scale + offset.x,
                    y: from.y * scale + offset.y,
                };
                const screenTo = {
                    x: to.x * scale + offset.x,
                    y: to.y * scale + offset.y,
                };
                const x = Math.min(screenFrom.x, screenTo.x);
                const y = Math.min(screenFrom.y, screenTo.y);
                const w = Math.abs(screenTo.x - screenFrom.x);
                const h = Math.abs(screenTo.y - screenFrom.y);
                ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
                ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = "rgb(59, 130, 246)";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);
                ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);
            }
        },
        [
            shapes,
            currentShape,
            selectedShapes,
            selectionHandles,
            isSingleLineLike,
            isRotating,
            selectionBox,
            offset,
            scale,
            themeDefaultStrokeColor,
        ]
    );

    const resizeCanvas = useCallback(
        (canvas: HTMLCanvasElement | null) => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw(canvas);
        },
        [draw]
    );

    return { draw, resizeCanvas };
}
