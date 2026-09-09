import { useMemo } from "react";
import type { Shape, Point, Handles } from "@/types";
import { Tools } from "@/types";
import {
    getBoundingBoxForShapes,
    getBoxCorners,
    getRotatedCorners,
    getFrameRotateHandle,
} from "@/utils/shapes";

export function useSelectionState(selectedShapes: Shape[]) {
    const isSingleLineLike =
        selectedShapes.length === 1 &&
        (selectedShapes[0].type === Tools.arrow ||
            selectedShapes[0].type === Tools.line);

    const selectionFrame = useMemo<{
        corners: Point[];
        angle: number;
    } | null>(() => {
        if (selectedShapes.length === 0 || isSingleLineLike) return null;

        if (selectedShapes.length === 1) {
            const shape = selectedShapes[0];
            return {
                corners: getRotatedCorners(shape),
                angle: shape.rotation,
            };
        }

        const box = getBoundingBoxForShapes(selectedShapes);
        return { corners: getBoxCorners(box), angle: 0 };
    }, [selectedShapes, isSingleLineLike]);

    const selectionHandles = useMemo<Partial<
        Record<Handles, Point>
    > | null>(() => {
        if (selectedShapes.length === 0) return null;
        if (isSingleLineLike) {
            return { from: selectedShapes[0].from, to: selectedShapes[0].to };
        }

        const frame = selectionFrame!;
        const [nw, ne, se, sw] = frame.corners;
        return {
            nw,
            ne,
            se,
            sw,
            rotate: getFrameRotateHandle(frame.corners, frame.angle),
        };
    }, [selectedShapes, isSingleLineLike, selectionFrame]);

    return { isSingleLineLike, selectionFrame, selectionHandles };
}
