import type { MouseEventHandler } from "react";

interface ToolButtonProps {
    icon: string;
    onClick: MouseEventHandler;
    tooltip?: string;
    isActive?: boolean;
}

export default function ToolButton({
    icon,
    onClick,
    tooltip = "",
    isActive = false,
}: ToolButtonProps) {
    return (
        <div
            title={tooltip}
            className={`p-1 flex items-center justify-center rounded-2xl ${isActive ? "bg-gray-500 hover:bg-gray-400" : "bg-gray-300 hover:bg-white"}`}
            onClick={onClick}
        >
            <img src={icon} alt={tooltip} className="max-w-full max-h-full" />
        </div>
    );
}
