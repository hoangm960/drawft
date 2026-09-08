import { useState, useCallback, useRef } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { saveBoard } from "@/utils/boardStorage";

type SaveStatus = "unsaved" | "saved" | "saving" | "error";

export function useBoardSaver() {
    const [status, setStatus] = useState<SaveStatus>("saved");
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const isDirtyRef = useRef(false);

    const markAsDirty = useCallback(() => {
        isDirtyRef.current = true;
        setStatus("unsaved");
    }, []);

    const persist = useCallback(async () => {
        setStatus("saving");
        // Artificial delay so the "Saving..." state is visible
        await new Promise(resolve => setTimeout(resolve, 300));

        const { shapes, offset, scale } = useCanvasStore.getState();
        const ok = saveBoard(shapes, offset, scale);
        setStatus(ok ? "saved" : "error");
        if (ok) {
            isDirtyRef.current = false;
            setSavedAt(new Date().toLocaleTimeString());
        }
        return ok;
    }, []);

    return {
        status,
        savedAt,
        isDirty: isDirtyRef.current,
        markAsDirty,
        persist,
    };
}
