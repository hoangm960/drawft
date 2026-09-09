import type { StrokePattern, StrokeStyle, FillStyle } from "@/types";

export const DEFAULT_STROKE: Required<StrokeStyle> = {
    strokeWidth: 2,
    strokeColor: "#ffffff",
    strokePattern: "solid",
};

export const DEFAULT_FILL: Required<FillStyle> = {
    fillColor: "transparent",
};

export const DEFAULT_OPACITY = 1;

export const DEFAULT_CORNER_RADIUS = 20;

export const STROKE_PATTERNS: Record<StrokePattern, number[]> = {
    solid: [],
    dashed: [8, 8],
    dotted: [2, 6],
};
