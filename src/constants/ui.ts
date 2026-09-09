import { Tools, type Handles } from "@/types";
import CursorIcon from "@assets/cursor.svg";
import PanIcon from "@assets/pan.svg";
import RectangleIcon from "@assets/rectangle.svg";
import DiamondIcon from "@assets/diamond.svg";
import EllipseIcon from "@assets/ellipse.svg";
import ArrowIcon from "@assets/arrow.svg";
import LineIcon from "@assets/line.svg";

export const HANDLES_CURSORS: Record<Handles, string> = {
    nw: "cursor-nwse-resize",
    ne: "cursor-nesw-resize",
    se: "cursor-nwse-resize",
    sw: "cursor-nesw-resize",
    from: "cursor-move",
    to: "cursor-move",
    rotate: "cursor-grab",
};

export const TOOLS_CONFIG = [
    { tool: Tools.pan, icon: PanIcon, tooltip: "Pan" },
    { tool: Tools.select, icon: CursorIcon, tooltip: "Select" },
    { tool: Tools.rect, icon: RectangleIcon, tooltip: "Rectangle" },
    { tool: Tools.dia, icon: DiamondIcon, tooltip: "Diamond" },
    { tool: Tools.ellipse, icon: EllipseIcon, tooltip: "Ellipse" },
    { tool: Tools.arrow, icon: ArrowIcon, tooltip: "Arrow" },
    { tool: Tools.line, icon: LineIcon, tooltip: "Line" },
] as const;
