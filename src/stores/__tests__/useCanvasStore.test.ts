import { Tools, type Point, type Shape } from "@/types";
import { useCanvasStore } from "../useCanvasStore";

const store = () => useCanvasStore.getState();

const makeShape = (
    id: number,
    from: Point,
    to: Point,
    type: Tools = Tools.rect
): Shape => ({ id, type, from, to });

describe("useCanvasStore", () => {
    beforeEach(() => {
        store().reset();
    });

    describe("addShape", () => {
        test("adds shape to map and index", () => {
            store().addShape(
                makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 })
            );

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 100, y: 100 },
                to: { x: 200, y: 300 },
            });
            expect(store().shapeIndex.all()).toEqual([
                { minX: 100, minY: 100, maxX: 200, maxY: 300, id: 1 },
            ]);
        });
    });

    describe("updateShape", () => {
        test("updates map and re-indexes the shape", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, {
                from: { x: 100, y: 100 },
                to: { x: 110, y: 110 },
            });

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 100, y: 100 },
                to: { x: 110, y: 110 },
            });
            expect(store().shapeIndex.all()).toEqual([
                { minX: 100, minY: 100, maxX: 110, maxY: 110, id: 1 },
            ]);
            expect(
                store().shapeIndex.search({
                    minX: 0,
                    minY: 0,
                    maxX: 10,
                    maxY: 10,
                })
            ).toEqual([]);
        });

        test("no update when the id does not exist", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(999, { to: { x: 50, y: 50 } });

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            });
            expect(store().shapeIndex.all()).toHaveLength(1);
        });
    });

    describe("deleteShapes", () => {
        test("removes shapes from map and index and prunes selectedIds", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().addShape(makeShape(3, { x: 40, y: 40 }, { x: 50, y: 50 }));
            store().setSelectedIds([1, 2]);

            store().deleteShapes([1, 2]);

            expect(store().shapes.has(1)).toBe(false);
            expect(store().shapes.has(2)).toBe(false);
            expect(store().shapes.has(3)).toBe(true);
            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
            ).toEqual([3]);
            expect(store().selectedIds).toEqual([]);
        });

        test("ignores ids that do not exist", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));

            store().deleteShapes([1, 999]);

            expect(store().shapes.size).toEqual(0);
            expect(store().shapeIndex.all()).toEqual([]);
        });
    });

    describe("moveSelectedShapes", () => {
        test("moves only the selected shapes in map and index", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1]);

            store().moveSelectedShapes(5, 5);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 5, y: 5 },
                to: { x: 15, y: 15 },
            });
            expect(store().shapes.get(2)).toEqual({
                id: 2,
                type: Tools.rect,
                from: { x: 20, y: 20 },
                to: { x: 30, y: 30 },
            });
            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
                    .sort()
            ).toEqual([1, 2]);
            expect(
                store().shapeIndex.search({
                    minX: 5,
                    minY: 5,
                    maxX: 15,
                    maxY: 15,
                })
            ).toEqual([{ minX: 5, minY: 5, maxX: 15, maxY: 15, id: 1 }]);
        });
    });

    describe("selectShapesInBox", () => {
        test("selects shapes intersecting the selection box", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(
                makeShape(2, { x: 100, y: 100 }, { x: 110, y: 110 })
            );
            store().addShape(makeShape(3, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectionBox({
                from: { x: 5, y: 5 },
                to: { x: 25, y: 25 },
            });

            store().selectShapesInBox();

            expect(new Set(store().selectedIds)).toEqual(new Set([1, 3]));
        });

        test("is a no-op when there is no selection box", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().setSelectionBox(null);
            store().selectShapesInBox();

            expect(store().selectedIds).toEqual([1]);
        });
    });

    describe("toggleSelectedIds", () => {
        test("multi toggles ids on and off", () => {
            store().toggleSelectedIds(1, true);
            store().toggleSelectedIds(2, true);
            expect(store().selectedIds).toEqual([1, 2]);

            store().toggleSelectedIds(1, true);
            expect(store().selectedIds).toEqual([2]);
        });

        test("single replaces the whole selection", () => {
            store().setSelectedIds([1]);
            store().toggleSelectedIds(2, false);
            expect(store().selectedIds).toEqual([2]);
        });
    });

    describe("getNextId", () => {
        test("returns 0 when there are no shapes", () => {
            expect(store().getNextId()).toEqual(0);
        });

        test("returns max id + 1", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().addShape(makeShape(5, { x: 40, y: 40 }, { x: 50, y: 50 }));

            expect(store().getNextId()).toEqual(6);
        });
    });

    describe("reset", () => {
        test("restores the initial state", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);
            store().setScale(2);
            store().setOffset({ x: 100, y: 100 });
            store().setCurrentShape(
                makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 })
            );

            store().reset();

            expect(store().shapes.size).toEqual(0);
            expect(store().shapeIndex.all()).toEqual([]);
            expect(store().selectedIds).toEqual([]);
            expect(store().scale).toEqual(1);
            expect(store().offset).toEqual({ x: 0, y: 0 });
            expect(store().currentShape).toBeNull();
        });
    });
});
