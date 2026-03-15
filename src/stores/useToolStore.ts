import { create } from "zustand";
import { Tools } from "../types";

export { Tools };

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
