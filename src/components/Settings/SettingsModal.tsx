import { useEffect } from "react";
import { useSettingsStore } from "@stores/useSettingsStore";
import type { StrokePattern } from "@/types";

interface SettingsModalProps {
    onClose: () => void;
}

interface SettingsModalProps {
    onClose: () => void;
}

const PATTERNS: StrokePattern[] = ["solid", "dashed", "dotted"];

function DefaultStylingSection() {
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

    return (
        <section className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Default Styling
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <label
                        htmlFor="stroke-width"
                        className="block text-gray-400 mb-1">
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
                        className="block text-gray-400 mb-1">
                        Stroke color
                    </label>
                    <input
                        id="stroke-color"
                        type="color"
                        value={strokeColor}
                        onChange={e => setStrokeColor(e.target.value)}
                        className="w-full h-8 p-1 bg-gray-700 rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1">
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
                                        ? "bg-gray-500 text-white"
                                        : "bg-gray-700 text-gray-300"
                                }`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="fill-color"
                        className="block text-gray-400 mb-1">
                        Fill color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="fill-color"
                            type="color"
                            value={fillColor ?? "#000000"}
                            onChange={e => setFillColor(e.target.value)}
                            className="w-full h-8 p-1 bg-gray-700 rounded"
                        />
                        <button
                            type="button"
                            onClick={() => setFillColor("transparent")}
                            className={`shrink-0 px-2 py-1 text-xs rounded-md capitalize ${
                                fillColor === "transparent"
                                    ? "bg-gray-500 text-white"
                                    : "bg-gray-700 text-gray-300"
                            }`}>
                            None
                        </button>
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="opacity"
                        className="block text-gray-400 mb-1">
                        Opacity ({Math.round(opacity * 100)}%)
                    </label>
                    <input
                        id="opacity"
                        type="range"
                        min={0}
                        max={100}
                        value={opacity * 100}
                        onChange={e => setOpacity(Number(e.target.value) / 100)}
                        className="w-full"
                    />
                </div>
                <div>
                    <label
                        htmlFor="corner-radius"
                        className="block text-gray-400 mb-1">
                        Corner radius ({cornerRadius}px)
                    </label>
                    <input
                        id="corner-radius"
                        type="range"
                        min={0}
                        max={50}
                        value={cornerRadius}
                        onChange={e => setCornerRadius(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        </section>
    );
}

function SaveSection() {
    const {
        autosave,
        setAutosave,
        autosaveMethod,
        setAutosaveMethod,
        autosaveInterval,
        setAutosaveInterval,
    } = useSettingsStore();

    return (
        <section className="p-4 border-b border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">
                Save Options
            </h3>
            <div className="flex items-center justify-between">
                <label htmlFor="autosave" className="text-sm text-gray-400">
                    Autosave enabled
                </label>
                <input
                    id="autosave"
                    type="checkbox"
                    checked={autosave}
                    onChange={e => setAutosave(e.target.checked)}
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
            </div>
            {autosave && (
                <div className="space-y-2">
                    <div className="text-sm text-gray-400">Autosave method</div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="radio"
                                name="autosave-method"
                                value="on_change"
                                checked={autosaveMethod === "on_change"}
                                onChange={() => setAutosaveMethod("on_change")}
                                className="bg-gray-700 border-gray-600"
                            />
                            On change
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="radio"
                                name="autosave-method"
                                value="interval"
                                checked={autosaveMethod === "interval"}
                                onChange={() => setAutosaveMethod("interval")}
                                className="bg-gray-700 border-gray-600"
                            />
                            Interval
                        </label>
                    </div>
                    {autosaveMethod === "interval" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={300}
                                value={autosaveInterval / 1000}
                                onChange={e =>
                                    setAutosaveInterval(
                                        Number(e.target.value) * 1000
                                    )
                                }
                                className="w-20 bg-gray-700 border-gray-600 rounded-md p-1 text-sm text-gray-200"
                            />
                            <span className="text-sm text-gray-400">
                                seconds
                            </span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function CanvasBackgroundSection() {
    const { canvasBackgroundColor, setCanvasBackgroundColor } =
        useSettingsStore();

    return (
        <section className="p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Canvas Background
            </h3>
            <div>
                <label
                    htmlFor="canvas-bg-color"
                    className="block text-sm text-gray-400 mb-1">
                    Background color
                </label>
                <input
                    id="canvas-bg-color"
                    type="color"
                    value={canvasBackgroundColor}
                    onChange={e => setCanvasBackgroundColor(e.target.value)}
                    className="w-full h-8 p-1 bg-gray-700 rounded"
                />
            </div>
        </section>
    );
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-gray-900/80 flex items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Settings">
            <div
                className="bg-gray-800 rounded-2xl w-full max-w-md shadow-xl"
                onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close settings">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </header>

                <DefaultStylingSection />
                <SaveSection />
                <CanvasBackgroundSection />

                <footer className="p-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-500">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
