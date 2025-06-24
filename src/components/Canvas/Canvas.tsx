import { useState, useRef, useEffect } from "react";
import { Tools, useTool } from "@stores/useToolStore";

interface Point {
    x: number;
    y: number;
}

interface Shape {
    id: number;
    type: Tools;
    from: Point;
    to: Point;
}

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    const [scale, setScale] = useState<number>(1);

    const { tool } = useTool();
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });
    const [startWorldPos, setStartWorldPos] = useState<Point | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw(canvas);
    }, [offset, scale, shapes, currentShape, selectedIds]);

    const getPosCompareToWorld = (x: number, y: number) => ({
        x: (x - offset.x) / scale,
        y: (y - offset.y) / scale,
    });

    const drawRectangle = (path: Path2D, from: Point, to: Point) => {
        path.rect(
            Math.min(from.x, to.x),
            Math.min(from.y, to.y),
            Math.abs(to.x - from.x),
            Math.abs(to.y - from.y)
        );
    };

    const drawDiamond = (path: Path2D, from: Point, to: Point) => {
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

    const drawEllipse = (path: Path2D, from: Point, to: Point) => {
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

    const drawArrow = (path: Path2D, from: Point, to: Point) => {
        const headlen = 10 / scale;
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

    const drawLine = (path: Path2D, from: Point, to: Point) => {
        path.moveTo(from.x, from.y);
        path.lineTo(to.x, to.y);
    };

    const getShapePath = (shape: Shape) => {
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

    const draw = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);
        ctx.clearRect(
            -offset.x / scale,
            -offset.y / scale,
            canvas.width / scale,
            canvas.height / scale
        );

        [...shapes, currentShape].forEach(shape => {
            if (!shape) return;

            const path = getShapePath(shape);

            ctx.strokeStyle =
                shape === currentShape || selectedIds.includes(shape.id)
                    ? "red"
                    : "blue";
            ctx.lineWidth = 2 / scale;
            ctx.stroke(path);
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = { x: e.clientX, y: e.clientY };
        const cursorWorldPos = getPosCompareToWorld(pos.x, pos.y);
        setIsDragging(true);
        setLastPos(pos);

        if (tool === Tools.pan || e.button === 1) return setIsPanning(true);

        if (tool === Tools.select) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            let hits: number[] = [];
            shapes.forEach(shape => {
                const path = getShapePath(shape);

                ctx.lineWidth = 10 / scale;
                const hit = ctx.isPointInStroke(
                    path,
                    cursorWorldPos.x,
                    cursorWorldPos.y
                );
                if (hit) hits.push(shape.id);
            });

            if (hits.length > 0) {
                setSelectedIds(hits);
                setStartWorldPos(cursorWorldPos);
                return;
            }

            if (selectedIds.length > 0) {
                setSelectedIds(hits);
            }
            return;
        }

        setStartWorldPos(cursorWorldPos);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;

        const pos = { x: e.clientX, y: e.clientY };
        const endWorldPos = getPosCompareToWorld(pos.x, pos.y);

        if (isPanning) {
            const dx = pos.x - lastPos.x;
            const dy = pos.y - lastPos.y;

            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPos(pos);

            return;
        }

        if (!startWorldPos) return;

        if (tool === Tools.select && selectedIds.length > 0) {
            const dx = endWorldPos.x - startWorldPos.x;
            const dy = endWorldPos.y - startWorldPos.y;

            setShapes(prev =>
                prev.map(shape =>
                    selectedIds.includes(shape.id)
                        ? {
                              ...shape,
                              from: {
                                  x: shape.from.x + dx,
                                  y: shape.from.y + dy,
                              },
                              to: {
                                  x: shape.to.x + dx,
                                  y: shape.to.y + dy,
                              },
                          }
                        : shape
                )
            );
            setStartWorldPos(endWorldPos);

            return;
        }

        setCurrentShape({
            id: shapes.length,
            type: tool,
            from: startWorldPos,
            to: endWorldPos,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsPanning(false);
        if (currentShape) {
            setShapes(prev => [...prev, currentShape]);
            setCurrentShape(null);
        }
        setStartWorldPos(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        const zoomCoef = 0.001;
        const zoomRange = [0.1, 5];

        const zoomAmount = -e.deltaY * zoomCoef;
        const newScale = Math.min(
            Math.max(zoomRange[0], scale + zoomAmount),
            zoomRange[1]
        );
        setScale(newScale);
    };

    return (
        <canvas
            id="whiteboard"
            className={`w-dvw h-dvh bg-gray-950 ${tool === Tools.pan ? "cursor-grab" : tool === Tools.select ? "" : "cursor-crosshair"}`}
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        />
    );
}
