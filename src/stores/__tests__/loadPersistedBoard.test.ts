import { useCanvasStore } from "../useCanvasStore";
import { makeShape } from "@/test/factories";

const store = () => useCanvasStore.getState();

describe("useCanvasStore loadPersistedBoard", () => {
    beforeEach(() => {
        store().reset();
    });

    test("restores shapes, viewport and rebuilds the spatial index", () => {
        const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });

        store().loadPersistedBoard({
            version: 1,
            shapes: [shape1, shape2],
            offset: { x: 100, y: 200 },
            scale: 2,
        });

        expect(store().shapes.get(1)).toEqual(shape1);
        expect(store().shapes.get(2)).toEqual(shape2);
        expect(store().offset).toEqual({ x: 100, y: 200 });
        expect(store().scale).toEqual(2);
        expect(
            store()
                .shapeIndex.all()
                .map(item => item.id)
                .sort()
        ).toEqual([1, 2]);
        expect(
            store().shapeIndex.search({
                minX: 0,
                minY: 0,
                maxX: 10,
                maxY: 10,
            })
        ).toEqual([{ minX: 0, minY: 0, maxX: 10, maxY: 10, id: 1 }]);
    });

    test("clears selection and history", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        store().addShape(shape);
        store().setSelectedIds([1]);

        store().loadPersistedBoard({
            version: 1,
            shapes: [],
            offset: { x: 0, y: 0 },
            scale: 1,
        });

        expect(store().shapes.size).toEqual(0);
        expect(store().selectedIds).toEqual([]);
        expect(store().currentShape).toBeNull();
        expect(store().past).toEqual([]);
        expect(store().future).toEqual([]);
    });

    test("deep-clones shapes so later mutations do not alias the payload", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        const board = {
            version: 1,
            shapes: [shape],
            offset: { x: 0, y: 0 },
            scale: 1,
        };

        store().loadPersistedBoard(board);
        store().setSelectedIds([1]);
        store().moveSelectedShapes(5, 5);

        expect(board.shapes[0].from).toEqual({ x: 0, y: 0 });
    });
});
