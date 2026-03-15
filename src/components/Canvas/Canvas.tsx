import { useRef, useCallback } from "react";
import { useTool } from "../../stores/useToolStore";
import { useCanvasStore } from "../../stores/useCanvasStore";
import { getShapePath } from "../../utils/shapes";
import type { Point } from "../../types";
import { Tools } from "../../types";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const { tool } = useTool();
    const {
        shapes,
        currentShape,
        selectedIds,
        isBoxSelecting,
        selectionBox,
        isDragging,
        isPanning,
        offset,
        scale,
        lastPos,
        startWorldPos,
        setCurrentShape,
        setSelectedIds,
        toggleSelectedIds,
        setSelectionBox,
        setIsBoxSelecting,
        setIsDragging,
        setIsPanning,
        setOffset,
        setScale,
        setLastPos,
        setStartWorldPos,
        moveSelectedShapes,
        selectShapesInBox,
        addShape,
    } = useCanvasStore();

    const getPosCompareToWorld = useCallback(
        (x: number, y: number): Point => ({
            x: (x - offset.x) / scale,
            y: (y - offset.y) / scale,
        }),
        [offset, scale]
    );

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

            [...shapes, currentShape].forEach(shape => {
                if (!shape) return;

                const path = getShapePath(shape);

                ctx.strokeStyle =
                    shape === currentShape || selectedIds.includes(shape.id)
                        ? "purple"
                        : "white";
                ctx.fillStyle = "transparent";
                ctx.lineWidth = 2 / scale;
                ctx.fill(path);
                ctx.stroke(path);
            });

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
        [shapes, currentShape, selectedIds, selectionBox, offset, scale]
    );

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw(canvas);
    }, [draw]);

    const hitTest = useCallback(
        (worldPos: Point): number | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            for (const shape of [...shapes].reverse()) {
                const path = getShapePath(shape);
                ctx.lineWidth = 10 / scale;
                const isInStroke = ctx.isPointInStroke(
                    path,
                    worldPos.x,
                    worldPos.y
                );
                const isInFill = ctx.isPointInPath(
                    path,
                    worldPos.x,
                    worldPos.y
                );
                if (isInStroke || isInFill) {
                    return shape.id;
                }
            }
            return null;
        },
        [shapes, scale]
    );

    const handleMouseDown: React.MouseEventHandler<HTMLCanvasElement> =
        useCallback(
            e => {
                const pos = { x: e.clientX, y: e.clientY };
                const cursorWorldPos = getPosCompareToWorld(pos.x, pos.y);
                setIsDragging(true);
                setLastPos(pos);

                if (tool === Tools.pan || e.button === 1) {
                    setIsPanning(true);
                    return;
                }

                if (tool === Tools.select) {
                    const hitId = hitTest(cursorWorldPos);

                    if (hitId !== null) {
                        const isAlreadySelected = selectedIds.includes(hitId);
                        if (e.shiftKey) {
                            toggleSelectedIds(hitId, true);
                        } else if (!isAlreadySelected) {
                            setSelectedIds([hitId]);
                        }
                        setStartWorldPos(cursorWorldPos);
                        return;
                    }

                    if (!e.shiftKey) {
                        setSelectedIds([]);
                        setIsBoxSelecting(true);
                        setSelectionBox({
                            from: cursorWorldPos,
                            to: cursorWorldPos,
                        });
                    }
                    return;
                }

                setStartWorldPos(cursorWorldPos);
            },
            [
                tool,
                getPosCompareToWorld,
                hitTest,
                setIsDragging,
                setLastPos,
                setIsPanning,
                setSelectedIds,
                toggleSelectedIds,
                setStartWorldPos,
                setIsBoxSelecting,
                setSelectionBox,
                selectedIds,
            ]
        );

    const handleMouseMove: React.MouseEventHandler<HTMLCanvasElement> =
        useCallback(
            e => {
                if (!isDragging) return;

                const pos = { x: e.clientX, y: e.clientY };
                const endWorldPos = getPosCompareToWorld(pos.x, pos.y);

                if (isPanning) {
                    const dx = pos.x - lastPos.x;
                    const dy = pos.y - lastPos.y;
                    setOffset({ x: offset.x + dx, y: offset.y + dy });
                    setLastPos(pos);
                    return;
                }

                if (isBoxSelecting) {
                    setSelectionBox({
                        from: selectionBox!.from,
                        to: endWorldPos,
                    });
                    return;
                }

                if (!startWorldPos) return;

                if (tool === Tools.select && selectedIds.length > 0) {
                    const dx = endWorldPos.x - startWorldPos.x;
                    const dy = endWorldPos.y - startWorldPos.y;
                    moveSelectedShapes(dx, dy);
                    setStartWorldPos(endWorldPos);
                    return;
                }

                setCurrentShape({
                    id: shapes.length,
                    type: tool,
                    from: startWorldPos,
                    to: endWorldPos,
                });
            },
            [
                isDragging,
                isPanning,
                isBoxSelecting,
                selectionBox,
                tool,
                selectedIds.length,
                startWorldPos,
                lastPos,
                offset,
                shapes.length,
                getPosCompareToWorld,
                setOffset,
                setLastPos,
                setSelectionBox,
                moveSelectedShapes,
                setStartWorldPos,
                setCurrentShape,
            ]
        );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsPanning(false);

        if (isBoxSelecting && selectionBox) {
            selectShapesInBox();
            setIsBoxSelecting(false);
            setSelectionBox(null);
            setStartWorldPos(null);
            return;
        }

        if (currentShape) {
            addShape(currentShape);
            setCurrentShape(null);
        }
        setStartWorldPos(null);
    }, [
        isBoxSelecting,
        selectionBox,
        currentShape,
        setIsDragging,
        setIsPanning,
        selectShapesInBox,
        setIsBoxSelecting,
        setSelectionBox,
        setStartWorldPos,
        addShape,
        setCurrentShape,
    ]);

    const handleWheel: React.WheelEventHandler<HTMLCanvasElement> = useCallback(
        e => {
            const zoomCoef = 0.001;
            const zoomRange = [0.1, 5];

            const zoomAmount = -e.deltaY * zoomCoef;
            const newScale = Math.min(
                Math.max(zoomRange[0], scale + zoomAmount),
                zoomRange[1]
            );
            setScale(newScale);
        },
        [scale, setScale]
    );

    const getCursorClass = () => {
        if (tool === Tools.pan) return "cursor-grab";
        if (tool === Tools.select) return "";
        return "cursor-crosshair";
    };

    return (
        <canvas
            id="whiteboard"
            className={`w-dvw h-dvh bg-gray-950 ${getCursorClass()}`}
            ref={el => {
                canvasRef.current = el;
                if (el) resizeCanvas();
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        />
    );
}
