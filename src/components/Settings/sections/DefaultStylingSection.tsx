import { useSettingsStore } from "@stores/useSettingsStore";
import type { StrokePattern } from "@/types";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];

export function DefaultStylingSection() {
    const {
        strokeWidth,
        strokeColor,
        strokePattern,
        fillColor,
        opacity,
        cornerRadius,
        setStrokeWidth,
        setStrokeColor,
        setStrokePattern,
        setFillColor,
        setOpacity,
        setCornerRadius,
    } = useSettingsStore();

    const isDark = useIsDarkMode();
    const themeDefaultStrokeColor = isDark ? "#ffffff" : "#000000";

    return (
        <section className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Default Styling
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <label
                        htmlFor="stroke-width"
                        className="block text-gray-600 dark:text-gray-400 mb-1">
                        Stroke width ({strokeWidth}px)
                    </label>
                    <input
                        id="stroke-width"
                        type="range"
                        min={1}
                        max={20}
                        value={strokeWidth}
                        onChange={e => setStrokeWidth(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label
                        htmlFor="stroke-color"
                        className="block text-gray-600 dark:text-gray-400 mb-1">
                        Stroke color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="stroke-color"
                            type="color"
                            value={strokeColor ?? themeDefaultStrokeColor}
                            onChange={e => setStrokeColor(e.target.value)}
                            className="w-full h-8 p-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                        <button
                            type="button"
                            onClick={() => setStrokeColor(undefined)}
                            className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize border ${
                                strokeColor === undefined
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                            }`}>
                            Auto
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">
                        Stroke pattern
                    </label>
                    <div className="flex gap-2">
                        {PATTERNS.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setStrokePattern(p)}
                                className={`px-2 py-1 text-xs rounded-md capitalize ${
                                    strokePattern === p
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                                }`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="fill-color"
                        className="block text-gray-600 dark:text-gray-400 mb-1">
                        Fill color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="fill-color"
                            type="color"
                            value={fillColor ?? "#000000"}
                            onChange={e => setFillColor(e.target.value)}
                            className="w-full h-8 p-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <button
                            type="button"
                            onClick={() => setFillColor("transparent")}
                            className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize ${
                                fillColor === "transparent"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                            }`}>
                            None
                        </button>
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="opacity"
                        className="block text-gray-600 dark:text-gray-400 mb-1">
                        Opacity ({Math.round(opacity * 100)}%)
                    </label>
                    <input
                        id="opacity"
                        type="range"
                        min={0}
                        max={100}
                        value={opacity * 100}
                        onChange={e => setOpacity(Number(e.target.value) / 100)}
                        className="w-full accent-blue-500"
                    />
                </div>
                <div>
                    <label
                        htmlFor="corner-radius"
                        className="block text-gray-600 dark:text-gray-400 mb-1">
                        Corner radius ({cornerRadius}px)
                    </label>
                    <input
                        id="corner-radius"
                        type="range"
                        min={0}
                        max={50}
                        value={cornerRadius}
                        onChange={e => setCornerRadius(Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                </div>
            </div>
        </section>
    );
}
