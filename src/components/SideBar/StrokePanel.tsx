import { useCanvasStore } from "@stores/useCanvasStore";
import { DEFAULT_STROKE } from "@/utils/shapes";
import type { Shape, StrokePattern } from "@/types";

const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];

export default function StrokePanel() {
    const { shapes, selectedIds, updateSelectedShapes } = useCanvasStore();

    const selectedShape: Shape | undefined = selectedIds
        .map(id => shapes.get(id))
        .filter((s): s is Shape => s !== undefined)[0];

    const width = selectedShape?.strokeWidth ?? DEFAULT_STROKE.strokeWidth;
    const color = selectedShape?.strokeColor ?? DEFAULT_STROKE.strokeColor;
    const pattern =
        selectedShape?.strokePattern ?? DEFAULT_STROKE.strokePattern;

    const isDisabled = selectedIds.length === 0;

    return (
        <div className="absolute left-full top-0 ml-2 w-48 bg-gray-800/90 rounded-xl p-3 flex flex-col gap-3 pointer-events-auto">
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
                                    updateSelectedShapes({ strokePattern: p })
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
                        onChange={e =>
                            updateSelectedShapes({
                                strokeColor: e.target.value,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
}
