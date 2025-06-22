import { useState, useRef, useEffect } from "react";
import { Tools, useTool } from "@/store.ts";

export default function Canvas() {
    const canvasRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const { tool, setTool } = useTool();
    const [shapes, setShapes] = useState([]);
    const [currentShape, setCurrentShape] = useState(null);
    const [selectedShapes, setSelectedShapes] = useState([]);

    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [startWorldPos, setStartWorldPos] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }, [offset, scale, shapes, currentShape, selectedShapes]);

    const getPosCompareToWorld = (x, y) => ({
        x: (x - offset.x) / scale,
        y: (y - offset.y) / scale,
    });

    const drawRectangle = (path, from, to) => {
        path.rect(
            Math.min(from.x, to.x),
            Math.min(from.y, to.y),
            Math.abs(to.x - from.x),
            Math.abs(to.y - from.y)
        );
    };

    const drawDiamond = (path, from, to) => {
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

    const drawEllipse = (path, from, to) => {
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

    const drawArrow = (path, from, to) => {
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

    const drawLine = (path, from, to) => {
        path.moveTo(from.x, from.y);
        path.lineTo(to.x, to.y);
    };

    const getShapePath = shape => {
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

    const draw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

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
                shape === currentShape || selectedShapes.includes(shape)
                    ? "red"
                    : "blue";
            ctx.lineWidth = 2 / scale;
            ctx.stroke(path);
        });
    };

    const handleMouseDown = e => {
        const pos = { x: e.clientX, y: e.clientY };
        const cursorWorldPos = getPosCompareToWorld(pos.x, pos.y);
        setIsDragging(true);
        setLastPos(pos);

        if (tool === Tools.pan) return;

        if (tool === Tools.select) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            let hits = [];
            shapes.forEach(shape => {
                const path = getShapePath(shape);

                ctx.lineWidth = 10 / scale;
                const hit = ctx.isPointInStroke(
                    path,
                    cursorWorldPos.x,
                    cursorWorldPos.y
                );
                if (hit) hits.push(shape);
            });

            return setSelectedShapes(hits);
        }

        setStartWorldPos(cursorWorldPos);
    };

    const handleMouseMove = e => {
        if (!isDragging) return;

        const pos = { x: e.clientX, y: e.clientY };

        if (tool === Tools.pan) {
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;

            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPos({ x: e.clientX, y: e.clientY });
        } else if (startWorldPos) {
            const endWorldPos = getPosCompareToWorld(pos.x, pos.y);
            setCurrentShape({
                type: tool,
                from: startWorldPos,
                to: endWorldPos,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (currentShape) {
            setShapes(prev => [...prev, currentShape]);
            setCurrentShape(null);
            setStartWorldPos(null);
        }
    };

    const handleWheel = e => {
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
