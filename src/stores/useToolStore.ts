import { create } from "zustand";

export enum Tools {
    pan = "pan",
    select = "select",
    rect = "rect",
    dia = "dia",
    ellipse = "ellipse",
    arrow = "arrow",
    line = "line",
}

interface ToolState {
    tool: Tools;
}

interface ToolActions {
    setTool: (value: Tools) => void;
}

type UseToolStore = ToolState & ToolActions;

export const useTool = create<UseToolStore>(set => ({
    tool: Tools.select,
    setTool: (value: Tools) => set(state => ({ ...state, tool: value })),
}));
