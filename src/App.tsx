import { useEffect } from "react";
import Canvas from "@components/Canvas/Canvas.tsx";
import ToolBar from "@components/ToolBar/ToolBar.tsx";
import SideBar from "@components/SideBar/Sidebar";
import BoardStatus from "@components/BoardStatus/BoardStatus";
import Settings from "@components/Settings/Settings";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

function App() {
    const isDark = useIsDarkMode();

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [isDark]);

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
