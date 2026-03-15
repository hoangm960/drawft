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

export interface Shape {
    id: number;
    type: Tools;
    from: Point;
    to: Point;
}

export interface ToolConfig {
    tool: Tools;
    icon: string;
    tooltip: string;
}
