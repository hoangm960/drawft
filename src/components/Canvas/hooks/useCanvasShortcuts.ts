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

            if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                const key = e.key.toLowerCase();
                const toolStore = useTool.getState();
                if (key === "1" || key === "v") {
                    toolStore.setTool(Tools.select);
                } else if (key === "h") {
                    toolStore.setTool(Tools.pan);
                } else if (key === "2" || key === "r") {
                    toolStore.setTool(Tools.rect);
                } else if (key === "3" || key === "d") {
                    toolStore.setTool(Tools.dia);
                } else if (key === "4" || key === "o") {
                    toolStore.setTool(Tools.ellipse);
                } else if (key === "5" || key === "a") {
                    toolStore.setTool(Tools.arrow);
                } else if (key === "6" || key === "l") {
                    toolStore.setTool(Tools.line);
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
