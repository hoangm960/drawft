import { create } from "zustand"

export enum Tools {
    rec,
    dia,
    ellipse,
    arrow,
    line,
}

export const useTool = create(set => ({
    tool: Tools.rec,
    setTool: value => set(state => ({ ...state, tool: value })),
}))
