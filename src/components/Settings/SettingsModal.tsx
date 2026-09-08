import { useEffect } from "react";
import {
    DEFAULT_CORNER_RADIUS,
    DEFAULT_FILL,
    DEFAULT_OPACITY,
    DEFAULT_STROKE,
} from "@/utils/shapes";

interface SettingsModalProps {
    onClose: () => void;
}

function DefaultStylingSection() {
    return (
        <section className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Default Styling
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                {/* TODO: Wire this section up to a new useSettingsStore */}
                <div>
                    <label
                        htmlFor="stroke-width"
                        className="block text-gray-400 mb-1">
                        Stroke width
                    </label>
                    <input
                        id="stroke-width"
                        type="range"
                        min={1}
                        max={20}
                        defaultValue={DEFAULT_STROKE.strokeWidth}
                        disabled
                        title="Not implemented yet"
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
                        defaultValue={DEFAULT_STROKE.strokeColor}
                        disabled
                        title="Not implemented yet"
                        className="w-full h-8 p-1 bg-gray-700 rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1">
                        Stroke pattern
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled
                            title="Not implemented yet"
                            className="px-2 py-1 text-xs rounded-md bg-gray-700 text-gray-300 opacity-50">
                            Solid
                        </button>
                        <button
                            type="button"
                            disabled
                            title="Not implemented yet"
                            className="px-2 py-1 text-xs rounded-md bg-gray-700 text-gray-300 opacity-50">
                            Dashed
                        </button>
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="fill-color"
                        className="block text-gray-400 mb-1">
                        Fill color
                    </label>
                    <input
                        id="fill-color"
                        type="color"
                        defaultValue={DEFAULT_FILL.fillColor}
                        disabled
                        title="Not implemented yet"
                        className="w-full h-8 p-1 bg-gray-700 rounded"
                    />
                </div>
                <div>
                    <label
                        htmlFor="opacity"
                        className="block text-gray-400 mb-1">
                        Opacity
                    </label>
                    <input
                        id="opacity"
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={DEFAULT_OPACITY * 100}
                        disabled
                        title="Not implemented yet"
                        className="w-full"
                    />
                </div>
                <div>
                    <label
                        htmlFor="corner-radius"
                        className="block text-gray-400 mb-1">
                        Corner radius
                    </label>
                    <input
                        id="corner-radius"
                        type="range"
                        min={0}
                        max={50}
                        defaultValue={DEFAULT_CORNER_RADIUS}
                        disabled
                        title="Not implemented yet"
                        className="w-full"
                    />
                </div>
            </div>
        </section>
    );
}

function SaveSection() {
    return (
        <section className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Save Options
            </h3>
            {/* TODO: Wire this section up to boardStorage and BoardStatus */}
            <div className="flex items-center justify-between">
                <label htmlFor="autosave" className="text-sm text-gray-400">
                    Autosave enabled
                </label>
                <input
                    id="autosave"
                    type="checkbox"
                    disabled
                    title="Not implemented yet"
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600"
                />
            </div>
            <button
                type="button"
                disabled
                title="Not implemented yet"
                className="mt-4 w-full px-4 py-2 text-sm rounded-md bg-blue-600 text-white opacity-50 cursor-not-allowed">
                Save now
            </button>
        </section>
    );
}

function CanvasBackgroundSection() {
    return (
        <section className="p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Canvas Background
            </h3>
            {/* TODO: Wire this up to Canvas.tsx background and persist */}
            <div>
                <label
                    htmlFor="canvas-bg-color"
                    className="block text-sm text-gray-400 mb-1">
                    Background color
                </label>
                <input
                    id="canvas-bg-color"
                    type="color"
                    defaultValue="#1a1a1a"
                    disabled
                    title="Not implemented yet"
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
