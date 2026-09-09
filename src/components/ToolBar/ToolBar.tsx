import ToolButton from "./ToolButton.tsx";
import { useTool } from "@stores/useToolStore";
import { useCanvasStore } from "@stores/useCanvasStore";
import { TOOLS_CONFIG } from "@/constants";

export default function ToolBar() {
    const { tool, setTool } = useTool();
    const { isDragging, isPanning, isBoxSelecting } = useCanvasStore();
    const isDisabled = isDragging || isPanning || isBoxSelecting;

    return (
        <div className="absolute bottom-0 w-full h-fit pb-4 flex items-center justify-center pointer-events-none">
            <div
                className={`bg-white/80 dark:bg-gray-600/30 h-20 w-fit flex flex-row gap-2 px-8 py-4 rounded-2xl pointer-events-auto shadow-sm dark:shadow-none ${isDisabled ? "pointer-events-none" : ""}`}>
                {TOOLS_CONFIG.map(({ tool: t, icon, tooltip, shortcut }) => (
                    <ToolButton
                        key={t}
                        icon={icon}
                        onClick={() => setTool(t)}
                        tooltip={tooltip}
                        shortcut={shortcut}
                        isActive={tool === t}
                        disabled={isDisabled}
                    />
                ))}
            </div>
        </div>
    );
}
