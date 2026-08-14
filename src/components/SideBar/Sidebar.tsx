import { useState } from "react";
import SidebarButton from "./SidebarButton.tsx";
import StrokePanel from "./StrokePanel.tsx";
import StrokeIcon from "@assets/stroke.svg";
import FillIcon from "@assets/fill.svg";

export default function Sidebar() {
    const [isStrokeOpen, setIsStrokeOpen] = useState(false);

    return (
        <>
            {isStrokeOpen && (
                <div
                    className="fixed inset-0"
                    onClick={() => setIsStrokeOpen(false)}
                />
            )}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-2xl bg-gray-600/30 pointer-events-auto">
                <SidebarButton
                    icon={StrokeIcon}
                    tooltip="Stroke"
                    isActive={isStrokeOpen}
                    onClick={() => setIsStrokeOpen(open => !open)}
                />
                <SidebarButton icon={FillIcon} tooltip="Fill" disabled />
                {isStrokeOpen && <StrokePanel />}
            </div>
        </>
    );
}
