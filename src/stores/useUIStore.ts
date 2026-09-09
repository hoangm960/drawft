import { create } from "zustand";
import type { Point, BoundingBox, Shape } from "@/types";

export interface UIState {
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

export interface UIActions {
    setCurrentShape: (shape: Shape | null) => void;
    setSelectedIds: (ids: number[]) => void;
    toggleSelectedIds: (id: number, multi: boolean) => void;
    setClipboard: (shapes: Shape[]) => void;
    setSelectionBox: (box: BoundingBox | null) => void;
    setIsBoxSelecting: (value: boolean) => void;
    setIsDragging: (value: boolean) => void;
    setIsPanning: (value: boolean) => void;
    setOffset: (offset: Point) => void;
    setScale: (scale: number) => void;
    setLastPos: (pos: Point) => void;
    setStartWorldPos: (pos: Point | null) => void;
    resetUI: () => void;
}

function createInitialState(): UIState {
    return {
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

export const useUIStore = create<UIState & UIActions>(set => ({
    ...createInitialState(),

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

    setClipboard: shapes => set({ clipboard: shapes }),

    setSelectionBox: box => set({ selectionBox: box }),

    setIsBoxSelecting: value => set({ isBoxSelecting: value }),

    setIsDragging: value => set({ isDragging: value }),

    setIsPanning: value => set({ isPanning: value }),

    setOffset: offset => set({ offset }),

    setScale: scale => set({ scale }),

    setLastPos: pos => set({ lastPos: pos }),

    setStartWorldPos: pos => set({ startWorldPos: pos }),

    resetUI: () => set(createInitialState()),
}));
