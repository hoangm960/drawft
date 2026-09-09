import { useSettingsStore } from "@stores/useSettingsStore";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

export function CanvasBackgroundSection() {
    const { canvasBackgroundColor, setCanvasBackgroundColor } =
        useSettingsStore();

    const isDark = useIsDarkMode();
    const defaultColor = isDark ? "#030712" : "#ffffff";

    return (
        <section className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between">
                <span>Canvas Background</span>
                {canvasBackgroundColor !== undefined && (
                    <button
                        type="button"
                        onClick={() => setCanvasBackgroundColor(undefined)}
                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                        Reset to Theme Default
                    </button>
                )}
            </h3>
            <div>
                <label
                    htmlFor="canvas-bg-color"
                    className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Background color
                </label>
                <input
                    id="canvas-bg-color"
                    type="color"
                    value={canvasBackgroundColor ?? defaultColor}
                    onChange={e => setCanvasBackgroundColor(e.target.value)}
                    className="w-full h-8 p-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
            </div>
        </section>
    );
}
