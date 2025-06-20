import { create } from "zustand";

export enum Tools {
    pan,
    rec,
    dia,
    ellipse,
    arrow,
    line,
}

export const useTool = create(set => ({
    tool: Tools.pan,
    setTool: value => set(state => ({ ...state, tool: value })),
}));
