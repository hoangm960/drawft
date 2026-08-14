import SidebarButton from "./SidebarButton.tsx";
import StrokeIcon from "@assets/stroke.svg";
import FillIcon from "@assets/fill.svg";

const PLACEHOLDER_ITEMS = [
    { icon: StrokeIcon, tooltip: "Stroke" },
    { icon: FillIcon, tooltip: "Fill" },
] as const;

export default function Sidebar() {
    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-2xl bg-gray-600/30 pointer-events-auto">
            {PLACEHOLDER_ITEMS.map(({ icon, tooltip }) => (
                <SidebarButton key={tooltip} icon={icon} tooltip={tooltip} />
            ))}
        </div>
    );
}
