import ToolButton from "./ToolButton.tsx";
import LineIcon from "@assets/line.svg";
import RectangleIcon from "@assets/rectangle.svg";
import EllipseIcon from "@assets/ellipse.svg";
import DiamondIcon from "@assets/diamond.svg";
import ArrowIcon from "@assets/arrow.svg";
import PanIcon from "@assets/pan.svg";
import CursorIcon from "@assets/cursor.svg";
import { Tools, useTool } from "../../stores/useToolStore";

const TOOLS_CONFIG = [
    { tool: Tools.pan, icon: PanIcon, tooltip: "Pan" },
    { tool: Tools.select, icon: CursorIcon, tooltip: "Select" },
    { tool: Tools.rect, icon: RectangleIcon, tooltip: "Rectangle" },
    { tool: Tools.dia, icon: DiamondIcon, tooltip: "Diamond" },
    { tool: Tools.ellipse, icon: EllipseIcon, tooltip: "Ellipse" },
    { tool: Tools.arrow, icon: ArrowIcon, tooltip: "Arrow" },
    { tool: Tools.line, icon: LineIcon, tooltip: "Line" },
] as const;

export default function ToolBar() {
    const { tool, setTool } = useTool();

    return (
        <div className="absolute bottom-0 w-full h-fit pb-4 flex items-center justify-center">
            <div className="bg-gray-600/30 h-20 w-fit flex flex-row gap-2 px-8 py-4 rounded-2xl">
                {TOOLS_CONFIG.map(({ tool: t, icon, tooltip }) => (
                    <ToolButton
                        key={t}
                        icon={icon}
                        onClick={() => setTool(t)}
                        tooltip={tooltip}
                        isActive={tool === t}
                    />
                ))}
            </div>
        </div>
    );
}
