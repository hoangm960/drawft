import { useSettingsStore } from "@stores/useSettingsStore";

export function SaveSection() {
    const {
        autosave,
        setAutosave,
        autosaveMethod,
        setAutosaveMethod,
        autosaveInterval,
        setAutosaveInterval,
    } = useSettingsStore();

    return (
        <section className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Save Options
            </h3>
            <div className="flex items-center justify-between">
                <label
                    htmlFor="autosave"
                    className="text-sm text-gray-700 dark:text-gray-400">
                    Autosave enabled
                </label>
                <input
                    id="autosave"
                    type="checkbox"
                    checked={autosave}
                    onChange={e => setAutosave(e.target.checked)}
                    className="h-4 w-4 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
            </div>
            {autosave && (
                <div className="space-y-2">
                    <div className="text-sm text-gray-700 dark:text-gray-400">
                        Autosave method
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
                            <input
                                type="radio"
                                name="autosave-method"
                                value="on_change"
                                checked={autosaveMethod === "on_change"}
                                onChange={() => setAutosaveMethod("on_change")}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600"
                            />
                            On change
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
                            <input
                                type="radio"
                                name="autosave-method"
                                value="interval"
                                checked={autosaveMethod === "interval"}
                                onChange={() => setAutosaveMethod("interval")}
                                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600"
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
                                className="w-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1 text-sm text-gray-900 dark:text-gray-200"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                seconds
                            </span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
