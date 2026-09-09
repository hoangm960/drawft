import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useSettingsStore } from "@stores/useSettingsStore";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import {
    getRotateDeltaAngle,
    getRotationCenter,
    getShapeCenter,
    getShapePath,
    resizeShapesFromHandle,
    rotatePoint,
    rotateShapesFromCenter,
} from "@/utils/shapes";
import { HANDLES_CURSORS, HANDLE_SIZE, ZOOM_COEF, ZOOM_RANGE } from "@/constants";
import type { Handles, Point, Shape } from "@/types";
import { Tools } from "@/types";
import { useSelectionState } from "./hooks/useSelectionState";
import { useCanvasShortcuts } from "./hooks/useCanvasShortcuts";
import { useWindowSelection } from "./hooks/useWindowSelection";
import { useCanvasDraw } from "./hooks/useCanvasDraw";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cursorWorldPosRef = useRef<Point | null>(null);
    const gestureStartShapesRef = useRef<Map<number, Shape> | null>(null);
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
        addShape,
        updateShape,
        getNextId,
        commitHistory,
    } = useCanvasStore();

    const selectedShapes = useMemo(
        () =>
            selectedIds
                .map(id => shapes.get(id) ?? null)
                .filter((s): s is Shape => s !== null),
        [selectedIds, shapes]
    );

    const { isSingleLineLike, selectionHandles } =
        useSelectionState(selectedShapes);

    const canvasBackgroundColor = useSettingsStore(
        state => state.canvasBackgroundColor
    );
    const isDark = useIsDarkMode();
    const themeDefaultStrokeColor = isDark ? "#ffffff" : "#000000";

    const getPosCompareToWorld = useCallback(
        (x: number, y: number): Point => ({
            x: (x - offset.x) / scale,
            y: (y - offset.y) / scale,
        }),
        [offset, scale]
    );

    useCanvasShortcuts(cursorWorldPosRef, getPosCompareToWorld);
    useWindowSelection(getPosCompareToWorld);

    const { resizeCanvas } = useCanvasDraw(
        shapes,
        currentShape,
        selectedShapes,
        selectionHandles,
        isSingleLineLike,
        isRotating,
        selectionBox,
        offset,
        scale,
        themeDefaultStrokeColor
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
                            gestureStartShapesRef.current =
                                useCanvasStore.getState().shapes;
                            setCurrentHandle("rotate");
                            setIsRotating(true);
                            setRotateStart(cursorWorldPos);
                            setResizeStart(selectedShapes);
                            return;
                        }

                        gestureStartShapesRef.current =
                            useCanvasStore.getState().shapes;
                        setCurrentHandle(handleHit);
                        setIsResizing(true);
                        setResizeStart(selectedShapes);
                        return;
                    }

                    const hitId = hitTest(cursorWorldPos);

                    if (hitId !== null) {
                        gestureStartShapesRef.current =
                            useCanvasStore.getState().shapes;
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

                if (tool !== Tools.select && tool !== Tools.pan) {
                    const defaultSettings = useSettingsStore.getState();
                    setCurrentShape({
                        id: getNextId(),
                        type: tool,
                        from: startWorldPos,
                        to: endWorldPos,
                        rotation: 0,
                        ...defaultSettings,
                    });
                }
            },
            [
                isDragging,
                isPanning,
                isBoxSelecting,
                isRotating,
                rotateStart,
                selectionBox,
                tool,
                startWorldPos,
                lastPos,
                offset,
                getNextId,
                getPosCompareToWorld,
                getHandleAt,
                setOffset,
                setLastPos,
                setSelectionBox,
                setCurrentShape,
                isResizing,
                currentHandle,
                resizeStart,
                updateShape,
                selectedIds,
                moveSelectedShapes,
                setStartWorldPos,
            ]
        );

    useEffect(() => {
        if (tool !== Tools.select) {
            setSelectedIds([]);
        }
    }, [tool, setSelectedIds]);

    const handleMouseUp = useCallback(() => {
        const startShapes = gestureStartShapesRef.current;
        gestureStartShapesRef.current = null;
        if (startShapes) {
            const currentShapes = useCanvasStore.getState().shapes;
            if (
                JSON.stringify([...startShapes]) !==
                JSON.stringify([...currentShapes])
            ) {
                commitHistory(startShapes);
            }
        }
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
            const store = useCanvasStore.getState();
            store.selectShapesInBox();
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
        setIsBoxSelecting,
        setSelectionBox,
        setStartWorldPos,
        addShape,
        setCurrentShape,
        commitHistory,
    ]);

    const handleWheel: React.WheelEventHandler<HTMLCanvasElement> = useCallback(
        e => {
            const zoomAmount = -e.deltaY * ZOOM_COEF;

            const rect = e.currentTarget.getBoundingClientRect();
            const cursor = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            const world = {
                x: (cursor.x - offset.x) / scale,
                y: (cursor.y - offset.y) / scale,
            };

            const newScale = Math.min(
                Math.max(ZOOM_RANGE[0], scale + zoomAmount),
                ZOOM_RANGE[1]
            );
            if (newScale === scale) return;
            setScale(newScale);
            const newOffset = {
                x: cursor.x - world.x * newScale,
                y: cursor.y - world.y * newScale,
            };
            setOffset(newOffset);
        },
        [offset, scale, setOffset, setScale]
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
            className={`w-dvw h-dvh ${getCursorClass()} bg-white dark:bg-[#030712]`}
            style={
                canvasBackgroundColor
                    ? { backgroundColor: canvasBackgroundColor }
                    : undefined
            }
            ref={el => {
                canvasRef.current = el;
                if (el) resizeCanvas(el);
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setHoverHandle(null)}
            onWheel={handleWheel}
        />
    );
}
