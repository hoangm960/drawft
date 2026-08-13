import { create } from "zustand";
import RBush from "rbush";
import type { Shape, Point, BoundingBox } from "@/types";
import { getBoundingBox, getBoundingBoxBounds } from "@/utils/shapes";

const PASTE_OFFSET = 10;

type ShapeBBox = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: number;
};

interface CanvasState {
    shapes: Map<number, Shape>;
    shapeIndex: RBush<ShapeBBox>;
    currentShape: Shape | null;
    selectedIds: number[];
    clipboard: Shape[];
    isBoxSelecting: boolean;
    selectionBox: BoundingBox | null;
    isDragging: boolean;
    isPanning: boolean;
    offset: Point;
    scale: number;
    lastPos: Point;
    startWorldPos: Point | null;
}

interface CanvasActions {
    addShape: (shape: Shape) => void;
    updateShape: (id: number, updates: Partial<Shape>) => void;
    deleteShapes: (ids: number[]) => void;
    setClipboard: (shapes: Shape[]) => void;
    copySelectedShapes: () => void;
    pasteShapes: () => void;
    duplicateSelectedShapes: () => void;
    setCurrentShape: (shape: Shape | null) => void;
    setSelectedIds: (ids: number[]) => void;
    toggleSelectedIds: (id: number, multi: boolean) => void;
    setSelectionBox: (box: BoundingBox | null) => void;
    setIsBoxSelecting: (value: boolean) => void;
    setIsDragging: (value: boolean) => void;
    setIsPanning: (value: boolean) => void;
    setOffset: (offset: Point) => void;
    setScale: (scale: number) => void;
    setLastPos: (pos: Point) => void;
    setStartWorldPos: (pos: Point | null) => void;
    moveSelectedShapes: (dx: number, dy: number) => void;
    selectShapesInBox: () => void;
    getNextId: () => number;
    reset: () => void;
}

function shapeBBox(shape: Shape): ShapeBBox {
    return { ...getBoundingBoxBounds(getBoundingBox(shape)), id: shape.id };
}

const sameBBoxId = (a: ShapeBBox, b: ShapeBBox) => a.id === b.id;

const cloneShapes = (
    state: CanvasState & CanvasActions,
    shapes: Shape[],
    dx: number,
    dy: number
) => {
    const newShapes = new Map(state.shapes);
    const ids: number[] = [];
    let nextId = state.getNextId();
    for (const shape of shapes) {
        const copy: Shape = {
            ...shape,
            id: nextId++,
            from: { x: shape.from.x + dx, y: shape.from.y + dy },
            to: { x: shape.to.x + dx, y: shape.to.y + dy },
        };
        newShapes.set(copy.id, copy);
        state.shapeIndex.insert(shapeBBox(copy));
        ids.push(copy.id);
    }
    return { shapes: newShapes, ids };
};

function createInitialState(): CanvasState {
    return {
        shapes: new Map(),
        shapeIndex: new RBush(),
        currentShape: null,
        selectedIds: [],
        clipboard: [],
        isBoxSelecting: false,
        selectionBox: null,
        isDragging: false,
        isPanning: false,
        offset: { x: 0, y: 0 },
        scale: 1,
        lastPos: { x: 0, y: 0 },
        startWorldPos: null,
    };
}

const initialState = createInitialState();

export const useCanvasStore = create<CanvasState & CanvasActions>(
    (set, get) => ({
        ...initialState,

        getNextId: () => {
            const state = get();
            let maxId = -1;
            for (const id of state.shapes.keys()) {
                if (id > maxId) maxId = id;
            }
            return maxId + 1;
        },

        addShape: shape => {
            const newShapes = new Map(get().shapes);
            newShapes.set(shape.id, shape);

            get().shapeIndex.insert(shapeBBox(shape));

            set({ shapes: newShapes });
        },

        updateShape: (id, updates) => {
            const state = get();
            const shape = state.shapes.get(id);
            if (!shape) return;

            const newShapes = new Map(state.shapes);
            const updatedShape = { ...shape, ...updates };
            newShapes.set(id, updatedShape);

            state.shapeIndex.remove(shapeBBox(shape), sameBBoxId);
            state.shapeIndex.insert(shapeBBox(updatedShape));

            set({ shapes: newShapes });
        },

        deleteShapes: ids => {
            const state = get();
            const newShapes = new Map(state.shapes);
            for (const id of ids) {
                const shape = newShapes.get(id);
                if (shape) {
                    state.shapeIndex.remove(shapeBBox(shape), sameBBoxId);
                }
                newShapes.delete(id);
            }

            set({
                shapes: newShapes,
                selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
            });
        },

        setClipboard: shapes => set({ clipboard: shapes }),

        copySelectedShapes: () => {
            const state = get();
            const selected = state.selectedIds
                .map(id => state.shapes.get(id))
                .filter((s): s is Shape => s !== undefined);
            if (selected.length === 0) return;
            set({
                clipboard: selected.map(shape => ({
                    ...shape,
                    from: { ...shape.from },
                    to: { ...shape.to },
                })),
            });
        },

        pasteShapes: () => {
            const state = get();
            if (state.clipboard.length === 0) return;

            const { shapes, ids } = cloneShapes(
                state,
                state.clipboard,
                PASTE_OFFSET,
                PASTE_OFFSET
            );
            set({ shapes, selectedIds: ids });
        },

        duplicateSelectedShapes: () => {
            const state = get();
            const selected = state.selectedIds
                .map(id => state.shapes.get(id))
                .filter((s): s is Shape => s !== undefined);
            if (selected.length === 0) return;

            const { shapes, ids } = cloneShapes(
                state,
                selected,
                PASTE_OFFSET,
                PASTE_OFFSET
            );
            set({ shapes, selectedIds: ids });
        },

        setCurrentShape: shape => set({ currentShape: shape }),

        setSelectedIds: ids => set({ selectedIds: ids }),

        toggleSelectedIds: (id, multi) =>
            set(state => {
                if (multi) {
                    return {
                        selectedIds: state.selectedIds.includes(id)
                            ? state.selectedIds.filter(i => i !== id)
                            : [...state.selectedIds, id],
                    };
                }
                return { selectedIds: [id] };
            }),

        setSelectionBox: box => set({ selectionBox: box }),

        setIsBoxSelecting: value => set({ isBoxSelecting: value }),

        setIsDragging: value => set({ isDragging: value }),

        setIsPanning: value => set({ isPanning: value }),

        setOffset: offset => set({ offset }),

        setScale: scale => set({ scale }),

        setLastPos: pos => set({ lastPos: pos }),

        setStartWorldPos: pos => set({ startWorldPos: pos }),

        moveSelectedShapes: (dx, dy) => {
            const state = get();
            const newShapes = new Map(state.shapes);

            for (const id of state.selectedIds) {
                const shape = newShapes.get(id);
                if (!shape) continue;

                state.shapeIndex.remove(shapeBBox(shape), sameBBoxId);

                const updatedShape = {
                    ...shape,
                    from: { x: shape.from.x + dx, y: shape.from.y + dy },
                    to: { x: shape.to.x + dx, y: shape.to.y + dy },
                };
                newShapes.set(id, updatedShape);
                state.shapeIndex.insert(shapeBBox(updatedShape));
            }

            set({ shapes: newShapes });
        },

        selectShapesInBox: () => {
            const state = get();
            if (!state.selectionBox) return;

            const boxBounds = getBoundingBoxBounds(state.selectionBox);

            const found = state.shapeIndex.search({
                minX: boxBounds.minX,
                minY: boxBounds.minY,
                maxX: boxBounds.maxX,
                maxY: boxBounds.maxY,
            });

            const selected = found.map(item => item.id as number);
            set({ selectedIds: selected });
        },

        reset: () => set(createInitialState()),
    })
);
