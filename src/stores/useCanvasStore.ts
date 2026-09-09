import type { Shape, Point } from "@/types";
import type { PersistedBoard } from "@/utils/boardStorage";
import { getBoundingBoxBounds, getBoundingBoxForShapes } from "@/utils/shapes";
import { PASTE_OFFSET } from "@/constants";
import { useDocumentStore } from "./useDocumentStore";
import { useUIStore } from "./useUIStore";

const createActions = () => {
    return {
        deleteShapes: (ids: number[]) => {
            useDocumentStore.getState().deleteShapes(ids);
            useUIStore
                .getState()
                .setSelectedIds(
                    useUIStore
                        .getState()
                        .selectedIds.filter(id => !ids.includes(id))
                );
        },

        commitHistory: (snapshot: Map<number, Shape>) => {
            useDocumentStore.getState().commitHistory(snapshot);
        },

        selectShapesInBox: () => {
            const uiState = useUIStore.getState();
            const docState = useDocumentStore.getState();
            if (!uiState.selectionBox) return;
            const boxBounds = getBoundingBoxBounds(uiState.selectionBox);
            const found = docState.shapeIndex.search({
                minX: boxBounds.minX,
                minY: boxBounds.minY,
                maxX: boxBounds.maxX,
                maxY: boxBounds.maxY,
            });
            uiState.setSelectedIds(found.map(item => item.id as number));
        },

        reset: () => {
            useDocumentStore.getState().resetDocument();
            useUIStore.getState().resetUI();
        },

        updateSelectedShapes: (updates: Partial<Shape>) => {
            useDocumentStore
                .getState()
                .updateSelectedShapes(
                    useUIStore.getState().selectedIds,
                    updates
                );
        },

        moveSelectedShapes: (dx: number, dy: number) => {
            useDocumentStore
                .getState()
                .moveShapes(useUIStore.getState().selectedIds, dx, dy);
        },

        duplicateSelectedShapes: () => {
            const result = useDocumentStore
                .getState()
                .duplicateShapes(
                    useUIStore.getState().selectedIds,
                    PASTE_OFFSET
                );
            useUIStore.getState().setSelectedIds(result.newIds);
        },

        copySelectedShapes: () => {
            const uiState = useUIStore.getState();
            const docState = useDocumentStore.getState();
            const selected = uiState.selectedIds
                .map(id => docState.shapes.get(id))
                .filter((s): s is Shape => s !== undefined);
            if (selected.length === 0) return;
            uiState.setClipboard(
                selected.map(shape => ({
                    ...shape,
                    from: { ...shape.from },
                    to: { ...shape.to },
                }))
            );
        },

        pasteShapes: (target: Point) => {
            const uiState = useUIStore.getState();
            const docState = useDocumentStore.getState();
            if (uiState.clipboard.length === 0) return;
            const box = getBoundingBoxForShapes(uiState.clipboard);
            const center = {
                x: (box.from.x + box.to.x) / 2,
                y: (box.from.y + box.to.y) / 2,
            };
            const result = docState.pasteShapes(uiState.clipboard, {
                x: target.x - center.x,
                y: target.y - center.y,
            });
            uiState.setSelectedIds(result.newIds);
        },

        setSelectedAll: () => {
            useUIStore
                .getState()
                .setSelectedIds([...useDocumentStore.getState().shapes.keys()]);
        },

        undo: () => {
            useDocumentStore.getState().undo();
            useUIStore.getState().setSelectedIds([]);
        },

        redo: () => {
            useDocumentStore.getState().redo();
            useUIStore.getState().setSelectedIds([]);
        },

        loadPersistedBoard: (board: PersistedBoard) => {
            const shapes = new Map<number, Shape>(
                board.shapes.map(shape => [
                    shape.id,
                    { ...shape, from: { ...shape.from }, to: { ...shape.to } },
                ])
            );
            useDocumentStore.getState().loadShapes(shapes);
            useUIStore.getState().resetUI();
            useUIStore.getState().setOffset({ ...board.offset });
            useUIStore.getState().setScale(board.scale);
        },
    };
};

const actions = createActions();

// This store acts as a facade/adapter for backwards compatibility
// during the transition, composing Document and UI actions.
export const useCanvasStore = () => {
    const docStore = useDocumentStore();
    const uiStore = useUIStore();

    return {
        ...docStore,
        ...uiStore,
        ...actions,
    };
};

useCanvasStore.getState = () => {
    return {
        ...useDocumentStore.getState(),
        ...useUIStore.getState(),
        ...actions,
    };
};
