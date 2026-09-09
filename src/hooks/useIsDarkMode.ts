import { useState, useEffect } from "react";
import { useSettingsStore } from "@stores/useSettingsStore";

export function useIsDarkMode() {
    const theme = useSettingsStore(state => state.theme);
    const [systemIsDark, setSystemIsDark] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
    );

    useEffect(() => {
        if (theme !== "system") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [theme]);

    return theme === "dark" || (theme === "system" && systemIsDark);
}
