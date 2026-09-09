import { useRef } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useSettingsStore } from "@stores/useSettingsStore";
import { clampOpacity } from "@/utils/shapes";
import { Tools, type Shape, type StrokePattern } from "@/types";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];

export default function ShapeSettings() {
    const { shapes, selectedIds, updateSelectedShapes } = useCanvasStore();
    const defaultSettings = useSettingsStore();
    const isDark = useIsDarkMode();
    const themeDefaultStrokeColor = isDark ? "#ffffff" : "#000000";

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

    const isDisabled = selectedIds.length === 0;

    const width = selectedShape?.strokeWidth ?? defaultSettings.strokeWidth;
    const color = selectedShape?.strokeColor ?? defaultSettings.strokeColor;
    const resolvedColor = color ?? themeDefaultStrokeColor;
    const pattern =
        selectedShape?.strokePattern ?? defaultSettings.strokePattern;
    const fillColor = selectedShape?.fillColor ?? defaultSettings.fillColor;
    const opacity = selectedShape?.opacity ?? defaultSettings.opacity;
    const cornerRadius =
        selectedShape?.cornerRadius ?? defaultSettings.cornerRadius;

    const showCornerRadius =
        selectedShapes.length > 0 &&
        selectedShapes.every(
            s => s.type === Tools.rect || s.type === Tools.dia
        );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                    Stroke
                </span>
                {isDisabled && (
                    <span className="text-xs text-gray-500">Defaults</span>
                )}
            </div>

            <div
                className={`flex flex-col gap-3 ${
                    isDisabled ? "opacity-50" : ""
                }`}>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
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
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                        Pattern
                    </span>
                    <div className="flex gap-1">
                        {PATTERNS.map(p => (
                            <button
                                key={p}
                                type="button"
                                disabled={isDisabled}
                                aria-label={`Stroke pattern ${p}`}
                                className={`px-2 py-1 text-xs rounded-md capitalize border ${
                                    pattern === p
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                }`}
                                onClick={() =>
                                    handleButtonCommit({ strokePattern: p })
                                }>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                        Color
                    </span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={resolvedColor}
                            disabled={isDisabled}
                            aria-label="Stroke color"
                            className="h-8 w-full cursor-pointer rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1"
                            onFocus={beginCapture}
                            onBlur={commitCapture}
                            onChange={e =>
                                updateSelectedShapes({
                                    strokeColor: e.target.value,
                                })
                            }
                        />
                        <button
                            type="button"
                            disabled={isDisabled}
                            aria-label="Auto stroke color"
                            className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize border ${
                                color === undefined
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                            }`}
                            onClick={() =>
                                handleButtonCommit({ strokeColor: undefined })
                            }>
                            Auto
                        </button>
                    </div>
                </div>
            </div>

            <span className="text-xs text-gray-700 dark:text-gray-300">
                Fill
            </span>

            <div
                className={`flex items-center gap-2 ${
                    isDisabled ? "opacity-50" : ""
                }`}>
                <input
                    type="color"
                    value={fillColor === "transparent" ? "#000000" : fillColor}
                    disabled={isDisabled}
                    aria-label="Fill color"
                    className="h-8 w-full cursor-pointer rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1"
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
                    className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize border ${
                        fillColor === "transparent"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() =>
                        handleButtonCommit({ fillColor: "transparent" })
                    }>
                    None
                </button>
            </div>

            <span className="text-xs text-gray-700 dark:text-gray-300">
                Opacity
            </span>

            <div
                className={`flex flex-col gap-1 ${
                    isDisabled ? "opacity-50" : ""
                }`}>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                    {Math.round(opacity * 100)}%
                </span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(opacity * 100)}
                    disabled={isDisabled}
                    aria-label="Opacity"
                    className="accent-blue-500"
                    onMouseDown={beginCapture}
                    onMouseUp={commitCapture}
                    onFocus={beginCapture}
                    onBlur={commitCapture}
                    onChange={e =>
                        updateSelectedShapes({
                            opacity: clampOpacity(Number(e.target.value) / 100),
                        })
                    }
                />
            </div>

            {showCornerRadius && (
                <>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                        Corner
                    </span>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-700 dark:text-gray-300">
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
                            className="accent-blue-500"
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
