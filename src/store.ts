import { create } from "zustand";

export enum Tools {
    pan,
    select,
    rect,
    dia,
    ellipse,
    arrow,
    line,
}

export const useTool = create(set => ({
    tool: Tools.select,
    setTool: value => set(state => ({ ...state, tool: value })),
}));
