import type { MouseEventHandler } from "react";

interface SidebarButtonProps {
    icon: string;
    tooltip: string;
    onClick?: MouseEventHandler;
    isActive?: boolean;
    disabled?: boolean;
}

export default function SidebarButton({
    icon,
    tooltip,
    onClick,
    isActive = false,
    disabled = false,
}: SidebarButtonProps) {
    const handleClick: MouseEventHandler = e => {
        if (!disabled) {
            onClick?.(e);
        }
    };

    return (
        <div
            title={tooltip}
            className={`p-1 flex items-center justify-center rounded-2xl ${isActive ? "bg-gray-500 hover:bg-gray-400" : "bg-gray-300 hover:bg-white"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            onClick={handleClick}>
            <img src={icon} alt={tooltip} className="w-10 h-10" />
        </div>
    );
}
