import { useRef } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { DEFAULT_CORNER_RADIUS, DEFAULT_STROKE } from "@/utils/shapes";
import { Tools, type Shape, type StrokePattern } from "@/types";

const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];

export default function ShapeSettings() {
    const { shapes, selectedIds, updateSelectedShapes } = useCanvasStore();
    const pendingSnapshotRef = useRef<Map<number, Shape> | null>(null);

    const beginCapture = () => {
        pendingSnapshotRef.current = useCanvasStore.getState().shapes;
    };

    const commitCapture = () => {
        const snapshot = pendingSnapshotRef.current;
        pendingSnapshotRef.current = null;
        if (!snapshot) return;
        if (
            JSON.stringify([...snapshot]) !==
            JSON.stringify([...useCanvasStore.getState().shapes])
        ) {
            useCanvasStore.getState().commitHistory(snapshot);
        }
    };

    const handleButtonCommit = (updates: Partial<Shape>) => {
        beginCapture();
        updateSelectedShapes(updates);
        commitCapture();
    };

    const selectedShapes = selectedIds
        .map(id => shapes.get(id))
        .filter((s): s is Shape => s !== undefined);

    const selectedShape: Shape | undefined = selectedShapes[0];

    const width = selectedShape?.strokeWidth ?? DEFAULT_STROKE.strokeWidth;
    const color = selectedShape?.strokeColor ?? DEFAULT_STROKE.strokeColor;
    const pattern =
        selectedShape?.strokePattern ?? DEFAULT_STROKE.strokePattern;
    const fillColor = selectedShape?.fillColor;
    const cornerRadius = selectedShape?.cornerRadius ?? DEFAULT_CORNER_RADIUS;

    const isDisabled = selectedIds.length === 0;
    const showCornerRadius =
        selectedShapes.length > 0 &&
        selectedShapes.every(
            s => s.type === Tools.rect || s.type === Tools.dia
        );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Stroke</span>
                {isDisabled && (
                    <span className="text-xs text-gray-500">
                        Select a shape
                    </span>
                )}
            </div>

            <div
                className={`flex flex-col gap-3 ${isDisabled ? "opacity-50" : ""}`}>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-300">
                        Width <span className="text-gray-500">{width}px</span>
                    </span>
                    <input
                        type="range"
                        min={1}
                        max={20}
                        value={width}
                        disabled={isDisabled}
                        aria-label="Stroke width"
                        onMouseDown={beginCapture}
                        onMouseUp={commitCapture}
                        onFocus={beginCapture}
                        onBlur={commitCapture}
                        onChange={e =>
                            updateSelectedShapes({
                                strokeWidth: Number(e.target.value),
                            })
                        }
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-300">Pattern</span>
                    <div className="flex gap-1">
                        {PATTERNS.map(p => (
                            <button
                                key={p}
                                type="button"
                                disabled={isDisabled}
                                aria-label={`Stroke pattern ${p}`}
                                className={`px-2 py-1 text-xs rounded-md capitalize ${pattern === p ? "bg-gray-500 text-white" : "bg-gray-700 text-gray-300"}`}
                                onClick={() =>
                                    handleButtonCommit({ strokePattern: p })
                                }>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-300">Color</span>
                    <input
                        type="color"
                        value={color}
                        disabled={isDisabled}
                        aria-label="Stroke color"
                        className="h-8 w-full cursor-pointer rounded-md bg-gray-700 p-1"
                        onFocus={beginCapture}
                        onBlur={commitCapture}
                        onChange={e =>
                            updateSelectedShapes({
                                strokeColor: e.target.value,
                            })
                        }
                    />
                </div>
            </div>

            <span className="text-xs text-gray-300">Fill</span>

            <div
                className={`flex items-center gap-2 ${isDisabled ? "opacity-50" : ""}`}>
                <input
                    type="color"
                    value={fillColor ?? "#ffffff"}
                    disabled={isDisabled}
                    aria-label="Fill color"
                    className="h-8 w-full cursor-pointer rounded-md bg-gray-700 p-1"
                    onFocus={beginCapture}
                    onBlur={commitCapture}
                    onChange={e =>
                        updateSelectedShapes({ fillColor: e.target.value })
                    }
                />
                <button
                    type="button"
                    disabled={isDisabled}
                    aria-label="No fill"
                    className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize ${fillColor ? "bg-gray-700 text-gray-300" : "bg-gray-500 text-white"}`}
                    onClick={() =>
                        handleButtonCommit({ fillColor: undefined })
                    }>
                    None
                </button>
            </div>

            {showCornerRadius && (
                <>
                    <span className="text-xs text-gray-300">Corner</span>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-300">
                            Radius{" "}
                            <span className="text-gray-500">
                                {cornerRadius}px
                            </span>
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={50}
                            value={cornerRadius}
                            aria-label="Corner radius"
                            onMouseDown={beginCapture}
                            onMouseUp={commitCapture}
                            onFocus={beginCapture}
                            onBlur={commitCapture}
                            onChange={e =>
                                updateSelectedShapes({
                                    cornerRadius: Number(e.target.value),
                                })
                            }
                        />
                    </div>
                </>
            )}
        </div>
    );
}
