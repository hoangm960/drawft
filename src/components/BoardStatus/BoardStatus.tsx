import { useEffect, useState } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { loadBoard, saveBoard } from "@/utils/boardStorage";

type SaveStatus = "unsaved" | "saved" | "error";

export default function BoardStatus() {
    const [status, setStatus] = useState<SaveStatus | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        const persist = (): boolean => {
            const { shapes, offset, scale } = useCanvasStore.getState();
            const ok = saveBoard(shapes, offset, scale);
            setStatus(ok ? "saved" : "error");
            if (ok) setSavedAt(new Date().toLocaleTimeString());
            return ok;
        };

        const board = loadBoard();
        if (board) {
            useCanvasStore.getState().loadPersistedBoard(board);
            setStatus("saved");
            setSavedAt(new Date().toLocaleTimeString());
        }

        const unsubscribe = useCanvasStore.subscribe((state, prev) => {
            if (
                state.shapes !== prev.shapes ||
                state.offset !== prev.offset ||
                state.scale !== prev.scale
            ) {
                setStatus("unsaved");
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
            unsubscribe();
            window.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    if (status === null) return null;

    const text =
        status === "unsaved"
            ? "Unsaved changes"
            : status === "saved"
              ? `Saved${savedAt ? ` ${savedAt}` : ""}`
              : "Save failed";

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-gray-600/30 px-3 py-1 text-xs text-gray-300">
            {text}
        </div>
    );
}
