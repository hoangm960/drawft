import { useState, useRef, useEffect } from "react";
import { Tools, useTool } from "@/store.ts";

export default function Canvas() {
    const canvasRef = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const { tool, setTool } = useTool();
    const [shapes, setShapes] = useState([]);
    const [currentShape, setCurrentShape] = useState(null);

    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [startWorldPos, setStartWorldPos] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }, [offset, scale, shapes, currentShape]);

    const getPosCompareToWorld = (x, y) => ({
        x: (x - offset.x) / scale,
        y: (y - offset.y) / scale,
    });

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
            const { type, from, to } = shape;
            ctx.beginPath();
            ctx.rect(
                Math.min(from.x, to.x),
                Math.min(from.y, to.y),
                Math.abs(to.x - from.x),
                Math.abs(to.y - from.y)
            );
            ctx.strokeStyle = shape === currentShape ? "red" : "blue";
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
        });
    };

    const handleMouseDown = e => {
        const pos = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
        setLastPos(pos);

        const startWorldPos = getPosCompareToWorld(pos.x, pos.y);
        setStartWorldPos(startWorldPos);
    };

    const handleMouseMove = e => {
        if (!isDragging) return;

        const pos = { x: e.clientX, y: e.clientY };
        const endWorldPos = getPosCompareToWorld(pos.x, pos.y);
        setCurrentShape({
            type: tool,
            from: startWorldPos,
            to: endWorldPos,
        });

        // const dx = e.clientX - lastPos.x
        // const dy = e.clientY - lastPos.y
        //
        // setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
        // setLastPos({ x: e.clientX, y: e.clientY })
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
            className="w-dvw h-dvh bg-gray-950"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        ></canvas>
    );
}
