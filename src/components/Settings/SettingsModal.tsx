import { useEffect } from "react";
import { ThemeSection } from "./sections/ThemeSection";
import { DefaultStylingSection } from "./sections/DefaultStylingSection";
import { SaveSection } from "./sections/SaveSection";
import { CanvasBackgroundSection } from "./sections/CanvasBackgroundSection";

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-gray-900/80 flex items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Settings">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl"
                onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        aria-label="Close settings">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </header>

                <ThemeSection />
                <DefaultStylingSection />
                <SaveSection />
                <CanvasBackgroundSection />

                <footer className="p-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
