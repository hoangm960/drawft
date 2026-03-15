import type { MouseEventHandler } from "react";

interface ToolButtonProps {
    icon: string;
    onClick: MouseEventHandler;
    tooltip?: string;
    isActive?: boolean;
    disabled?: boolean;
}

export default function ToolButton({
    icon,
    onClick,
    tooltip = "",
    isActive = false,
    disabled = false,
}: ToolButtonProps) {
    const handleClick: MouseEventHandler = e => {
        if (!disabled) {
            onClick(e);
        }
    };

    return (
        <div
            title={tooltip}
            className={`p-1 flex items-center justify-center rounded-2xl ${isActive ? "bg-gray-500 hover:bg-gray-400" : "bg-gray-300 hover:bg-white"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            onClick={handleClick}
        >
            <img src={icon} alt={tooltip} className="max-w-full max-h-full" />
        </div>
    );
}
