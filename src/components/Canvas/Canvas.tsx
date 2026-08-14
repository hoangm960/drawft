import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import {
    DEFAULT_STROKE,
    getBoundingBoxForShapes,
    getBoxCorners,
    getFrameRotateHandle,
    getRotateDeltaAngle,
    getRotationCenter,
    getRotatedCorners,
    getShapeCenter,
    getShapePath,
    getStrokeDashScaled,
    resizeShapesFromHandle,
    rotatePoint,
    rotateShapesFromCenter,
} from "@/utils/shapes";
import type { Handles, Point, Shape } from "@/types";
import { Tools } from "@/types";

const HANDLE_SIZE = 8;

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
    const cursorWorldPosRef = useRef<Point | null>(null);
    const [currentHandle, setCurrentHandle] = useState<Handles | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [resizeStart, setResizeStart] = useState<Shape[] | null>(null);
    const [rotateStart, setRotateStart] = useState<Point | null>(null);
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
        copySelectedShapes,
        pasteShapes,
        duplicateSelectedShapes,
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

    const selectionFrame = useMemo<{
        corners: Point[];
        angle: number;
    } | null>(() => {
        if (selectedShapes.length === 0 || isSingleLineLike) return null;

        if (selectedShapes.length === 1) {
            const shape = selectedShapes[0];
            return {
                corners: getRotatedCorners(shape),
                angle: shape.rotation,
            };
        }

        const box = getBoundingBoxForShapes(selectedShapes);
        return { corners: getBoxCorners(box), angle: 0 };
    }, [selectedShapes, isSingleLineLike]);

    const selectionHandles = useMemo<Partial<
        Record<Handles, Point>
    > | null>(() => {
        if (selectedShapes.length === 0) return null;
        if (isSingleLineLike) {
            return { from: selectedShapes[0].from, to: selectedShapes[0].to };
        }

        const frame = selectionFrame!;
        const [nw, ne, se, sw] = frame.corners;
        return {
            nw,
            ne,
            se,
            sw,
            rotate: getFrameRotateHandle(frame.corners, frame.angle),
        };
    }, [selectedShapes, isSingleLineLike, selectionFrame]);

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

            const drawShape = (shape: Shape) => {
                const path = getShapePath(shape);

                ctx.save();
                if (shape.rotation !== 0) {
                    const center = getShapeCenter(shape);
                    ctx.translate(center.x, center.y);
                    ctx.rotate(shape.rotation);
                    ctx.translate(-center.x, -center.y);
                }
                ctx.strokeStyle =
                    shape.strokeColor ?? DEFAULT_STROKE.strokeColor;
                ctx.fillStyle = "transparent";
                ctx.lineWidth =
                    (shape.strokeWidth ?? DEFAULT_STROKE.strokeWidth) / scale;
                ctx.setLineDash(
                    getStrokeDashScaled(shape.strokePattern, scale)
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
                const center = getShapeCenter(shape);
                const local = rotatePoint(worldPos, center, -shape.rotation);
                ctx.lineWidth = 10 / scale;
                const isInStroke = ctx.isPointInStroke(path, local.x, local.y);
                const isInFill = ctx.isPointInPath(path, local.x, local.y);
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
                            setCurrentHandle("rotate");
                            setIsRotating(true);
                            setRotateStart(cursorWorldPos);
                            setResizeStart(selectedShapes);
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
                cursorWorldPosRef.current = getPosCompareToWorld(pos.x, pos.y);

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

                if (isRotating && rotateStart && resizeStart) {
                    const center = getRotationCenter(resizeStart);
                    const angle = getRotateDeltaAngle(
                        center,
                        rotateStart,
                        endWorldPos
                    );
                    for (const {
                        id,
                        from,
                        to,
                        rotation,
                    } of rotateShapesFromCenter(resizeStart, center, angle)) {
                        updateShape(id, { from, to, rotation });
                    }
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
                    rotation: 0,
                });
            },
            [
                isDragging,
                isPanning,
                isBoxSelecting,
                isRotating,
                rotateStart,
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
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                const state = useCanvasStore.getState();
                if (state.selectedIds.length > 0) {
                    deleteShapes(state.selectedIds);
                }
            }

            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (key === "c") {
                    copySelectedShapes();
                    e.preventDefault();
                } else if (key === "v") {
                    pasteShapes(
                        cursorWorldPosRef.current ??
                            getPosCompareToWorld(
                                window.innerWidth / 2,
                                window.innerHeight / 2
                            )
                    );
                    e.preventDefault();
                } else if (key === "d") {
                    duplicateSelectedShapes();
                    e.preventDefault();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        copySelectedShapes,
        deleteShapes,
        duplicateSelectedShapes,
        pasteShapes,
        getPosCompareToWorld,
    ]);

    useEffect(() => {
        if (tool !== Tools.select) {
            setSelectedIds([]);
        }
    }, [tool, setSelectedIds]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsPanning(false);

        if (isRotating) {
            setIsRotating(false);
            setRotateStart(null);
            setResizeStart(null);
            setCurrentHandle(null);
            setStartWorldPos(null);
            return;
        }

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
        isRotating,
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
