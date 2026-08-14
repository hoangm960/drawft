class MockPath2D {
    calls: Array<{
        method: string;
        args: number[];
    }> = [];

    rect(x: number, y: number, w: number, h: number) {
        this.calls.push({ method: "rect", args: [x, y, w, h] });
    }

    roundRect(x: number, y: number, w: number, h: number, radius: number) {
        this.calls.push({ method: "roundRect", args: [x, y, w, h, radius] });
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.calls.push({ method: "arcTo", args: [x1, y1, x2, y2, radius] });
    }

    ellipse(
        x: number,
        y: number,
        radiusX: number,
        radiusY: number,
        rotation: number,
        startAngle: number,
        endAngle: number
    ) {
        this.calls.push({
            method: "ellipse",
            args: [x, y, radiusX, radiusY, rotation, startAngle, endAngle],
        });
    }

    moveTo(x: number, y: number) {
        this.calls.push({ method: "moveTo", args: [x, y] });
    }

    lineTo(x: number, y: number) {
        this.calls.push({ method: "lineTo", args: [x, y] });
    }

    closePath() {
        this.calls.push({ method: "closePath", args: [] });
    }

    reset() {
        this.calls = [];
    }
}

(globalThis as Record<string, unknown>).Path2D = MockPath2D;
