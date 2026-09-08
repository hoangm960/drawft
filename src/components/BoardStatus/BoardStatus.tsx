import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useSettingsStore } from "@stores/useSettingsStore";
import { loadBoard } from "@/utils/boardStorage";
import { useBoardSaver } from "@/hooks/useBoardSaver";

export default function BoardStatus() {
    const { status, savedAt, isDirty, markAsDirty, persist } = useBoardSaver();
    const { autosave, autosaveMethod, autosaveInterval } = useSettingsStore();
    const timeoutRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    const debouncedSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            persist();
        }, 2000);
    }, [persist]);

    useEffect(() => {
        const board = loadBoard();
        if (board) {
            useCanvasStore.getState().loadPersistedBoard(board);
        }
    }, []);

    useEffect(() => {
        const canvasSub = useCanvasStore.subscribe((state, prev) => {
            if (
                state.shapes !== prev.shapes ||
                state.offset !== prev.offset ||
                state.scale !== prev.scale
            ) {
                markAsDirty();
            }
        });

        const onKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                persist();
            }
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            canvasSub();
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [persist, markAsDirty]);

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [isDirty]);

    useEffect(() => {
        // Cleanup previous timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (autosave && isDirty) {
            if (autosaveMethod === "on_change") {
                debouncedSave();
            } else if (autosaveMethod === "interval") {
                intervalRef.current = window.setInterval(() => {
                    if (isDirty) {
                        persist();
                    }
                }, autosaveInterval);
            }
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [
        autosave,
        isDirty,
        autosaveMethod,
        autosaveInterval,
        debouncedSave,
        persist,
    ]);

    const text =
        status === "unsaved"
            ? "Unsaved"
            : status === "saving"
              ? "Saving..."
              : status === "saved"
                ? `Saved${savedAt ? ` ${savedAt}` : ""}`
                : "Error";

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-gray-600/30 px-3 py-1 text-xs text-gray-300">
            {text}
        </div>
    );
}
