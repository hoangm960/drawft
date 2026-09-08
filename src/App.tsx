import { useEffect } from "react";
import Canvas from "@components/Canvas/Canvas.tsx";
import ToolBar from "@components/ToolBar/ToolBar.tsx";
import SideBar from "@components/SideBar/Sidebar";
import BoardStatus from "@components/BoardStatus/BoardStatus";
import Settings from "@components/Settings/Settings";
import { useSettingsStore } from "@stores/useSettingsStore";

function App() {
    const theme = useSettingsStore(state => state.theme);

    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = () => {
            if (
                theme === "dark" ||
                (theme === "system" &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches)
            ) {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        };

        applyTheme();

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = () => applyTheme();
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);

    return (
        <div className="w-full h-full">
            <Canvas />
            <SideBar />
            <ToolBar />
            <BoardStatus />
            <Settings />
        </div>
    );
}

export default App;
