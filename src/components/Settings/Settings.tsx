import { useState } from "react";
import SettingsModal from "./SettingsModal";
import SettingsIcon from "@assets/settings.svg";
import ToolButton from "../ToolBar/ToolButton";

export default function Settings() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="absolute top-4 right-4 z-20 h-12 w-12 pointer-events-auto">
                <ToolButton
                    icon={SettingsIcon}
                    tooltip="Settings"
                    isActive={isOpen}
                    onClick={() => setIsOpen(true)}
                />
            </div>
            {isOpen && <SettingsModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
