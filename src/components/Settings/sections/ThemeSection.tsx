import { useSettingsStore } from "@stores/useSettingsStore";

export function ThemeSection() {
    const { theme, setTheme } = useSettingsStore();

    return (
        <section className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Theme
            </h3>
            <div className="flex gap-4">
                {(["system", "light", "dark"] as const).map(t => (
                    <label
                        key={t}
                        className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300 capitalize cursor-pointer">
                        <input
                            type="radio"
                            name="theme"
                            value={t}
                            checked={theme === t}
                            onChange={() => setTheme(t)}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        {t}
                    </label>
                ))}
            </div>
        </section>
    );
}
