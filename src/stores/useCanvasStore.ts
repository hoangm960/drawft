import { create } from "zustand";
import type { Shape, Point, BoundingBox } from "../types";

interface CanvasState {
    shapes: Shape[];
    currentShape: Shape | null;
    selectedIds: number[];
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
    reset: () => void;
}

const initialState: CanvasState = {
    shapes: [],
    currentShape: null,
    selectedIds: [],
    isBoxSelecting: false,
    selectionBox: null,
    isDragging: false,
    isPanning: false,
    offset: { x: 0, y: 0 },
    scale: 1,
    lastPos: { x: 0, y: 0 },
    startWorldPos: null,
};

export const useCanvasStore = create<CanvasState & CanvasActions>(
    (set, get) => ({
        ...initialState,

        addShape: shape => set(state => ({ shapes: [...state.shapes, shape] })),

        updateShape: (id, updates) =>
            set(state => ({
                shapes: state.shapes.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                ),
            })),

        deleteShapes: ids =>
            set(state => ({
                shapes: state.shapes.filter(s => !ids.includes(s.id)),
                selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
            })),

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

        moveSelectedShapes: (dx, dy) =>
            set(state => ({
                shapes: state.shapes.map(s =>
                    state.selectedIds.includes(s.id)
                        ? {
                              ...s,
                              from: { x: s.from.x + dx, y: s.from.y + dy },
                              to: { x: s.to.x + dx, y: s.to.y + dy },
                          }
                        : s
                ),
            })),

        selectShapesInBox: () => {
            const state = get();
            if (!state.selectionBox) return;
            const selected = state.shapes
                .filter(s => {
                    const shapeBounds = {
                        from: {
                            x: Math.min(s.from.x, s.to.x),
                            y: Math.min(s.from.y, s.to.y),
                        },
                        to: {
                            x: Math.max(s.from.x, s.to.x),
                            y: Math.max(s.from.y, s.to.y),
                        },
                    };
                    const box = state.selectionBox;
                    if (!box) return false;
                    const boxBounds = {
                        minX: Math.min(box.from.x, box.to.x),
                        maxX: Math.max(box.from.x, box.to.x),
                        minY: Math.min(box.from.y, box.to.y),
                        maxY: Math.max(box.from.y, box.to.y),
                    };
                    return !(
                        shapeBounds.to.x < boxBounds.minX ||
                        shapeBounds.from.x > boxBounds.maxX ||
                        shapeBounds.to.y < boxBounds.minY ||
                        shapeBounds.from.y > boxBounds.maxY
                    );
                })
                .map(s => s.id);
            set({ selectedIds: selected });
        },

        reset: () => set(initialState),
    })
);
