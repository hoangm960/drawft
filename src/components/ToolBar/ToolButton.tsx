interface ToolButtonProps {
    icon: String;
    onClick: void;
    tooltip?: String;
}

export default function ToolButton({
    icon,
    onClick,
    tooltip = "",
}: ToolButtonProps) {
    return (
        <div
            title={tooltip}
            className="bg-gray-300 p-1 flex items-center justify-center rounded-2xl hover:bg-white"
            onClick={onClick}
        >
            <img src={icon} alt={tooltip} className="max-w-full max-h-full" />
        </div>
    );
}
