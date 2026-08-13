import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import {
    getBoundingBoxForShapes,
    getCornerHandles,
    getRotateHandle,
    getShapePath,
    resizeShapesFromHandle,
} from "@/utils/shapes";
import type { Handles, Point, Shape } from "@/types";
import { Tools } from "@/types";

const HANDLE_SIZE = 8;
const ROTATE_HANDLE_PADDING = 50;

const HANDLES_CURSORS: Record<Handles, string> = {
    nw: "cursor-nwse-resize",
    ne: "cursor-nesw-resize",
    se: "cursor-nwse-resize",
    sw: "cursor-nesw-resize",
    from: "cursor-move",
    to: "cursor-move",
    rotate: "cursor-grab",
};

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [currentHandle, setCurrentHandle] = useState<Handles | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState<Shape[] | null>(null);
    const [hoverHandle, setHoverHandle] = useState<Handles | null>(null);

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
        updateShape,
        deleteShapes,
        getNextId,
    } = useCanvasStore();

    const selectedShapes = useMemo(
        () =>
            selectedIds
                .map(id => shapes.get(id) ?? null)
                .filter((s): s is Shape => s !== null),
        [selectedIds, shapes]
    );

    const isSingleLineLike =
        selectedShapes.length === 1 &&
        (selectedShapes[0].type === Tools.arrow ||
            selectedShapes[0].type === Tools.line);

    const selectionHandles = useMemo<Partial<
        Record<Handles, Point>
    > | null>(() => {
        const box = getBoundingBoxForShapes(selectedShapes);
        return selectedShapes.length === 0
            ? null
            : isSingleLineLike
              ? { from: selectedShapes[0].from, to: selectedShapes[0].to }
              : {
                    ...getCornerHandles(box),
                    rotate: getRotateHandle(box, ROTATE_HANDLE_PADDING),
                };
    }, [selectedShapes, isSingleLineLike]);

    const getPosCompareToWorld = useCallback(
        (x: number, y: number): Point => ({
            x: (x - offset.x) / scale,
            y: (y - offset.y) / scale,
        }),
        [offset, scale]
    );

    const getHandleAt = useCallback(
        (screenPos: Point): Handles | null => {
            if (!selectionHandles) return null;
            let closest: Handles | null = null;
            let closestDist = HANDLE_SIZE;
            for (const handle of Object.keys(selectionHandles) as Handles[]) {
                const world = selectionHandles[handle]!;
                const sx = world.x * scale + offset.x;
                const sy = world.y * scale + offset.y;
                const dist = Math.hypot(screenPos.x - sx, screenPos.y - sy);
                if (dist <= closestDist) {
                    closestDist = dist;
                    closest = handle;
                }
            }
            return closest;
        },
        [selectionHandles, scale, offset]
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

            shapes.forEach(shape => {
                const path = getShapePath(shape);

                ctx.strokeStyle = selectedIds.includes(shape.id)
                    ? "purple"
                    : "white";
                ctx.fillStyle = "transparent";
                ctx.lineWidth = 2 / scale;
                ctx.fill(path);
                ctx.stroke(path);
            });

            if (currentShape) {
                const path = getShapePath(currentShape);

                ctx.strokeStyle = "purple";
                ctx.fillStyle = "transparent";
                ctx.lineWidth = 2 / scale;
                ctx.fill(path);
                ctx.stroke(path);
            }

            if (selectionHandles) {
                const handleSize = HANDLE_SIZE / scale;

                if (!isSingleLineLike) {
                    const box = getBoundingBoxForShapes(selectedShapes);

                    ctx.strokeStyle = "purple";
                    ctx.fillStyle = "transparent";
                    ctx.lineWidth = 1 / scale;
                    ctx.setLineDash([4 / scale, 4 / scale]);
                    ctx.strokeRect(
                        box.from.x,
                        box.from.y,
                        box.to.x - box.from.x,
                        box.to.y - box.from.y
                    );
                    ctx.setLineDash([]);
                }

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
            selectedIds,
            selectedShapes,
            selectionHandles,
            isSingleLineLike,
            selectionBox,
            offset,
            scale,
        ]
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

            for (const shape of [...shapes.values()].reverse()) {
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
                    const handleHit = getHandleAt(pos);
                    if (handleHit) {
                        if (handleHit === "rotate") {
                            return;
                        }

                        setCurrentHandle(handleHit);
                        setIsResizing(true);
                        setResizeStart(selectedShapes);
                        return;
                    }

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
                getPosCompareToWorld,
                setIsDragging,
                setLastPos,
                tool,
                setStartWorldPos,
                setIsPanning,
                getHandleAt,
                hitTest,
                selectedShapes,
                selectedIds,
                toggleSelectedIds,
                setSelectedIds,
                setIsBoxSelecting,
                setSelectionBox,
            ]
        );

    const handleMouseMove: React.MouseEventHandler<HTMLCanvasElement> =
        useCallback(
            e => {
                const pos = { x: e.clientX, y: e.clientY };

                if (!isDragging) {
                    setHoverHandle(
                        tool === Tools.select ? getHandleAt(pos) : null
                    );
                    return;
                }

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

                if (
                    isResizing &&
                    currentHandle &&
                    currentHandle !== "rotate" &&
                    resizeStart
                ) {
                    const resized = resizeShapesFromHandle(
                        resizeStart,
                        currentHandle,
                        endWorldPos
                    );
                    for (const { id, from, to } of resized) {
                        updateShape(id, { from, to });
                    }
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
                    id: getNextId(),
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
                getNextId,
                getPosCompareToWorld,
                getHandleAt,
                setOffset,
                setLastPos,
                setSelectionBox,
                moveSelectedShapes,
                setStartWorldPos,
                setCurrentShape,
                isResizing,
                currentHandle,
                resizeStart,
                updateShape,
            ]
        );

    useEffect(() => {
        if (!isBoxSelecting) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            const pos = { x: e.clientX, y: e.clientY };
            const endWorldPos = getPosCompareToWorld(pos.x, pos.y);
            setSelectionBox({
                from: selectionBox!.from,
                to: endWorldPos,
            });
        };

        const handleWindowMouseUp = () => {
            selectShapesInBox();
            setIsBoxSelecting(false);
            setSelectionBox(null);
            setStartWorldPos(null);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            window.removeEventListener("mouseup", handleWindowMouseUp);
        };
    }, [
        isBoxSelecting,
        selectionBox,
        getPosCompareToWorld,
        setSelectionBox,
        selectShapesInBox,
        setIsBoxSelecting,
        setStartWorldPos,
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                const state = useCanvasStore.getState();
                if (state.selectedIds.length > 0) {
                    deleteShapes(state.selectedIds);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [deleteShapes]);

    useEffect(() => {
        if (tool !== Tools.select) {
            setSelectedIds([]);
        }
    }, [tool, setSelectedIds]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsPanning(false);

        if (isResizing) {
            setIsResizing(false);
            setCurrentHandle(null);
            setResizeStart(null);
            setStartWorldPos(null);
            return;
        }

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
        isResizing,
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
        if (tool === Tools.select && hoverHandle) {
            return HANDLES_CURSORS[hoverHandle];
        }
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
            onMouseLeave={() => setHoverHandle(null)}
            onWheel={handleWheel}
        />
    );
}
