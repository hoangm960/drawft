interface SidebarButtonProps {
    icon: string;
    tooltip: string;
}

export default function SidebarButton({ icon, tooltip }: SidebarButtonProps) {
    return (
        <div
            title={tooltip}
            className="p-1 flex items-center justify-center rounded-2xl bg-gray-300 hover:bg-white opacity-50 pointer-events-none">
            <img src={icon} alt={tooltip} className="w-10 h-10" />
        </div>
    );
}
