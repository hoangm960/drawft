import type { Shape, Point } from "@/types";
import type { PersistedBoard } from "@/utils/boardStorage";
import { getBoundingBoxBounds, getBoundingBoxForShapes } from "@/utils/shapes";
import { useDocumentStore } from "./useDocumentStore";
import { useUIStore } from "./useUIStore";

const PASTE_OFFSET = 10;

// This store acts as a facade/adapter for backwards compatibility
// during the transition, composing Document and UI actions.
export const useCanvasStore = () => {
    const docStore = useDocumentStore();
    const uiStore = useUIStore();

    return {
        ...docStore,
        ...uiStore,

        // Complex actions that cross boundaries
        deleteShapes: (ids: number[]) => {
            docStore.deleteShapes(ids);
            uiStore.setSelectedIds(
                uiStore.selectedIds.filter(id => !ids.includes(id))
            );
        },

        updateSelectedShapes: (updates: Partial<Shape>) => {
            docStore.updateSelectedShapes(uiStore.selectedIds, updates);
        },

        moveSelectedShapes: (dx: number, dy: number) => {
            docStore.moveShapes(uiStore.selectedIds, dx, dy);
        },

        duplicateSelectedShapes: () => {
            const result = docStore.duplicateShapes(
                uiStore.selectedIds,
                PASTE_OFFSET
            );
            uiStore.setSelectedIds(result.newIds);
        },

        copySelectedShapes: () => {
            const selected = uiStore.selectedIds
                .map(id => docStore.shapes.get(id))
                .filter((s): s is Shape => s !== undefined);
            if (selected.length === 0) return;
            uiStore.setClipboard(
                selected.map(shape => ({
                    ...shape,
                    from: { ...shape.from },
                    to: { ...shape.to },
                }))
            );
        },

        pasteShapes: (target: Point) => {
            if (uiStore.clipboard.length === 0) return;
            const box = getBoundingBoxForShapes(uiStore.clipboard);
            const center = {
                x: (box.from.x + box.to.x) / 2,
                y: (box.from.y + box.to.y) / 2,
            };
            const result = docStore.pasteShapes(uiStore.clipboard, {
                x: target.x - center.x,
                y: target.y - center.y,
            });
            uiStore.setSelectedIds(result.newIds);
        },

        setSelectedAll: () => {
            uiStore.setSelectedIds([...docStore.shapes.keys()]);
        },

        selectShapesInBox: () => {
            if (!uiStore.selectionBox) return;
            const boxBounds = getBoundingBoxBounds(uiStore.selectionBox);
            const found = docStore.shapeIndex.search({
                minX: boxBounds.minX,
                minY: boxBounds.minY,
                maxX: boxBounds.maxX,
                maxY: boxBounds.maxY,
            });
            uiStore.setSelectedIds(found.map(item => item.id as number));
        },

        undo: () => {
            docStore.undo();
            uiStore.setSelectedIds([]);
        },

        redo: () => {
            docStore.redo();
            uiStore.setSelectedIds([]);
        },

        loadPersistedBoard: (board: PersistedBoard) => {
            const shapes = new Map<number, Shape>(
                board.shapes.map(shape => [
                    shape.id,
                    { ...shape, from: { ...shape.from }, to: { ...shape.to } },
                ])
            );
            docStore.loadShapes(shapes);
            uiStore.resetUI();
            uiStore.setOffset({ ...board.offset });
            uiStore.setScale(board.scale);
        },

        reset: () => {
            docStore.resetDocument();
            uiStore.resetUI();
        },
    };
};

useCanvasStore.getState = () => {
    return {
        ...useDocumentStore.getState(),
        ...useUIStore.getState(),

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
