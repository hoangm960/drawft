import { create } from "zustand";
import RBush from "rbush";
import type { Shape, Point } from "@/types";
import { getBoundingBox, getBoundingBoxBounds } from "@/utils/shapes";

export type ShapeBBox = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: number;
};

export interface DocumentState {
    shapes: Map<number, Shape>;
    shapeIndex: RBush<ShapeBBox>;
    past: Map<number, Shape>[];
    future: Map<number, Shape>[];
}

export interface DocumentActions {
    addShape: (shape: Shape) => void;
    updateShape: (id: number, updates: Partial<Shape>) => void;
    deleteShapes: (ids: number[]) => void;
    getNextId: () => number;
    undo: () => void;
    redo: () => void;
    commitHistory: (snapshot: Map<number, Shape>) => void;
    loadShapes: (shapes: Map<number, Shape>) => void;
    resetDocument: () => void;
    updateSelectedShapes: (ids: number[], updates: Partial<Shape>) => void;
    moveShapes: (ids: number[], dx: number, dy: number) => void;
    duplicateShapes: (
        ids: number[],
        offset: number
    ) => { shapes: Map<number, Shape>; newIds: number[] };
    pasteShapes: (
        clipboard: Shape[],
        target: Point
    ) => { shapes: Map<number, Shape>; newIds: number[] };
}

export function shapeBBox(shape: Shape): ShapeBBox {
    return { ...getBoundingBoxBounds(getBoundingBox(shape)), id: shape.id };
}

export const sameBBoxId = (a: ShapeBBox, b: ShapeBBox) => a.id === b.id;

export const cloneShapesMap = (
    shapes: Map<number, Shape>
): Map<number, Shape> =>
    new Map(
        [...shapes].map(([id, shape]) => [
            id,
            { ...shape, from: { ...shape.from }, to: { ...shape.to } },
        ])
    );

export const rebuildShapeIndex = (
    shapes: Map<number, Shape>
): RBush<ShapeBBox> => {
    const index = new RBush<ShapeBBox>();
    for (const shape of shapes.values()) {
        index.insert(shapeBBox(shape));
    }
    return index;
};

const recordHistory = (
    get: () => DocumentState & DocumentActions,
    set: (partial: Partial<DocumentState & DocumentActions>) => void
) => {
    set({ past: [...get().past, cloneShapesMap(get().shapes)], future: [] });
};

function createInitialState(): DocumentState {
    return {
        shapes: new Map(),
        shapeIndex: new RBush(),
        past: [],
        future: [],
    };
}

export const useDocumentStore = create<DocumentState & DocumentActions>(
    (set, get) => ({
        ...createInitialState(),

        getNextId: () => {
            const state = get();
            let maxId = -1;
            for (const id of state.shapes.keys()) {
                if (id > maxId) maxId = id;
            }
            return maxId + 1;
        },

        addShape: shape => {
            recordHistory(get, set);
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

        updateSelectedShapes: (ids, updates) => {
            const state = get();
            const newShapes = new Map(state.shapes);

            for (const id of ids) {
                const shape = newShapes.get(id);
                if (!shape) continue;

                state.shapeIndex.remove(shapeBBox(shape), sameBBoxId);

                const updatedShape = { ...shape, ...updates };
                newShapes.set(id, updatedShape);
                state.shapeIndex.insert(shapeBBox(updatedShape));
            }

            set({ shapes: newShapes });
        },

        deleteShapes: ids => {
            const state = get();
            if (ids.length === 0) return;
            recordHistory(get, set);
            const newShapes = new Map(state.shapes);
            for (const id of ids) {
                const shape = newShapes.get(id);
                if (shape) {
                    state.shapeIndex.remove(shapeBBox(shape), sameBBoxId);
                }
                newShapes.delete(id);
            }

            set({ shapes: newShapes });
        },

        moveShapes: (ids, dx, dy) => {
            const state = get();
            const newShapes = new Map(state.shapes);

            for (const id of ids) {
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

        duplicateShapes: (ids, offset) => {
            const state = get();
            const selected = ids
                .map(id => state.shapes.get(id))
                .filter((s): s is Shape => s !== undefined);

            if (selected.length === 0)
                return { shapes: state.shapes, newIds: ids };

            recordHistory(get, set);

            const newShapes = new Map(state.shapes);
            const newIds: number[] = [];
            let nextId = state.getNextId();

            for (const shape of selected) {
                const copy: Shape = {
                    ...shape,
                    id: nextId++,
                    from: {
                        x: shape.from.x + offset,
                        y: shape.from.y + offset,
                    },
                    to: { x: shape.to.x + offset, y: shape.to.y + offset },
                };
                newShapes.set(copy.id, copy);
                state.shapeIndex.insert(shapeBBox(copy));
                newIds.push(copy.id);
            }

            set({ shapes: newShapes });
            return { shapes: newShapes, newIds };
        },

        pasteShapes: (clipboard, target) => {
            const state = get();
            if (clipboard.length === 0)
                return { shapes: state.shapes, newIds: [] };

            const newShapes = new Map(state.shapes);
            const newIds: number[] = [];
            let nextId = state.getNextId();

            for (const shape of clipboard) {
                const copy: Shape = {
                    ...shape,
                    id: nextId++,
                    from: {
                        x: shape.from.x + target.x,
                        y: shape.from.y + target.y,
                    },
                    to: { x: shape.to.x + target.x, y: shape.to.y + target.y },
                };
                newShapes.set(copy.id, copy);
                state.shapeIndex.insert(shapeBBox(copy));
                newIds.push(copy.id);
            }

            recordHistory(get, set);
            set({ shapes: newShapes });
            return { shapes: newShapes, newIds };
        },

        undo: () => {
            const state = get();
            if (state.past.length === 0) return;

            const previous = state.past[state.past.length - 1];
            set({
                past: state.past.slice(0, -1),
                future: [...state.future, cloneShapesMap(state.shapes)],
                shapes: previous,
                shapeIndex: rebuildShapeIndex(previous),
            });
        },

        redo: () => {
            const state = get();
            if (state.future.length === 0) return;

            const next = state.future[state.future.length - 1];
            set({
                future: state.future.slice(0, -1),
                past: [...state.past, cloneShapesMap(state.shapes)],
                shapes: next,
                shapeIndex: rebuildShapeIndex(next),
            });
        },

        commitHistory: snapshot => {
            const state = get();
            set({ past: [...state.past, snapshot], future: [] });
        },

        loadShapes: shapes => {
            set({
                shapes,
                shapeIndex: rebuildShapeIndex(shapes),
                past: [],
                future: [],
            });
        },

        resetDocument: () => set(createInitialState()),
    })
);
