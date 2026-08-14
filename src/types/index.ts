export interface Point {
    x: number;
    y: number;
}

export interface BoundingBox {
    from: Point;
    to: Point;
}

export enum Tools {
    pan = "pan",
    select = "select",
    rect = "rect",
    dia = "dia",
    ellipse = "ellipse",
    arrow = "arrow",
    line = "line",
}

interface BaseEntity {
    id: number;
    type: Tools;
}

interface Geometry {
    from: Point;
    to: Point;
    rotation: number;
}

export interface StrokeStyle {
    strokeWidth?: number;
    strokeColor?: string;
    strokePattern?: StrokePattern;
}

export interface FillStyle {
    fillColor?: string;
}

export interface Shape extends BaseEntity, Geometry, StrokeStyle, FillStyle {}

export type CornerHandle = "nw" | "ne" | "se" | "sw";
export type EndpointHandle = "from" | "to";
export type ResizeHandle = CornerHandle | EndpointHandle;
export type Handles = ResizeHandle | "rotate";

export type StrokePattern = "solid" | "dashed" | "dotted";
