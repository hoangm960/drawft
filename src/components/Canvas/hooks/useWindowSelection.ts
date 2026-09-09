import { useEffect } from "react";
import { useCanvasStore } from "@stores/useCanvasStore";
import type { Point } from "@/types";

export function useWindowSelection(
    getPosCompareToWorld: (x: number, y: number) => Point
) {
    const {
        isBoxSelecting,
        selectionBox,
        setSelectionBox,
        selectShapesInBox,
        setIsBoxSelecting,
        setStartWorldPos,
    } = useCanvasStore();

    useEffect(() => {
        if (!isBoxSelecting) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            const pos = { x: e.clientX, y: e.clientY };
            const endWorldPos = getPosCompareToWorld(pos.x, pos.y);
            setSelectionBox({
                from: selectionBox!.from,
                to: endWorldPos,
            });
        };

        const handleWindowMouseUp = () => {
            selectShapesInBox();
            setIsBoxSelecting(false);
            setSelectionBox(null);
            setStartWorldPos(null);
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            window.removeEventListener("mouseup", handleWindowMouseUp);
        };
    }, [
        isBoxSelecting,
        selectionBox,
        getPosCompareToWorld,
        setSelectionBox,
        selectShapesInBox,
        setIsBoxSelecting,
        setStartWorldPos,
    ]);
}
