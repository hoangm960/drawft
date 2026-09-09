import { useEffect } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import { useTool } from "@stores/useToolStore";
import { Tools, type Point } from "@/types";

export function useCanvasShortcuts(
    cursorWorldPosRef: React.RefObject<Point | null>,
    getPosCompareToWorld: (x: number, y: number) => Point
) {
    const {
        deleteShapes,
        undo,
        redo,
        copySelectedShapes,
        pasteShapes,
        duplicateSelectedShapes,
        setSelectedAll,
    } = useCanvasStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                const state = useCanvasStore.getState();
                if (state.selectedIds.length > 0) {
                    deleteShapes(state.selectedIds);
                }
            }

            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (key === "z") {
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    e.preventDefault();
                } else if (key === "y") {
                    redo();
                    e.preventDefault();
                } else if (key === "c") {
                    copySelectedShapes();
                    e.preventDefault();
                } else if (key === "v") {
                    pasteShapes(
                        cursorWorldPosRef.current ??
                            getPosCompareToWorld(
                                window.innerWidth / 2,
                                window.innerHeight / 2
                            )
                    );
                    e.preventDefault();
                } else if (key === "d") {
                    duplicateSelectedShapes();
                    e.preventDefault();
                } else if (key === "a") {
                    setSelectedAll();
                    useTool.getState().setTool(Tools.select);
                    e.preventDefault();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        copySelectedShapes,
        deleteShapes,
        duplicateSelectedShapes,
        pasteShapes,
        getPosCompareToWorld,
        undo,
        redo,
        setSelectedAll,
        cursorWorldPosRef,
    ]);
}
