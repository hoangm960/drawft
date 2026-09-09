import type { MouseEventHandler } from "react";

interface ToolButtonProps {
    icon: string;
    onClick: MouseEventHandler;
    tooltip?: string;
    shortcut?: string;
    isActive?: boolean;
    disabled?: boolean;
}

export default function ToolButton({
    icon,
    onClick,
    tooltip = "",
    shortcut,
    isActive = false,
    disabled = false,
}: ToolButtonProps) {
    const handleClick: MouseEventHandler = e => {
        if (!disabled) {
            onClick(e);
        }
    };

    let titleText = tooltip;
    if (shortcut) {
        const parts = shortcut.split(",").map(s => s.trim());
        if (parts.length > 1) {
            titleText = `${tooltip} - ${parts[0]} (or ${parts[1]})`;
        } else {
            titleText = `${tooltip} - ${parts[0]}`;
        }
    }

    return (
        <button
            type="button"
            title={titleText}
            className={`relative group p-2 w-14 h-14 flex items-center justify-center rounded-2xl transition-colors ${
                isActive
                    ? "bg-gray-200 dark:bg-gray-500 hover:bg-gray-300 dark:hover:bg-gray-400"
                    : "bg-transparent dark:bg-gray-300 hover:bg-gray-100 dark:hover:bg-white"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            onClick={handleClick}>
            <img src={icon} alt={tooltip} className="max-w-full max-h-full" />
            {shortcut && (
                <span className="absolute bottom-1 right-1.5 text-xs leading-none text-gray-500 font-medium pointer-events-none select-none">
                    {shortcut.split(",")[0].trim()}
                </span>
            )}
        </button>
    );
}
