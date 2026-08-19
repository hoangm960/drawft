import { Tools } from "@/types";
import { makeShape } from "@/test/factories";
import { useCanvasStore } from "../useCanvasStore";

const store = () => useCanvasStore.getState();

describe("useCanvasStore", () => {
    beforeEach(() => {
        store().reset();
    });

    describe("addShape", () => {
        test("adds the shape to the map", () => {
            store().addShape(
                makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 })
            );

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 100, y: 100 },
                to: { x: 200, y: 300 },
                rotation: 0,
            });
        });

        test("indexes the shape bbox for hit-testing", () => {
            store().addShape(
                makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 })
            );

            expect(store().shapeIndex.all()).toEqual([
                { minX: 100, minY: 100, maxX: 200, maxY: 300, id: 1 },
            ]);
        });
    });

    describe("updateShape", () => {
        test("updates the shape in the map", () => {
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
                rotation: 0,
            });
        });

        test("re-indexes the shape bbox on update", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, {
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
                rotation: 0,
            });
            expect(store().shapeIndex.all()).toHaveLength(1);
        });
    });

    describe("updateSelectedShapes", () => {
        test("applies partial updates to every selected shape", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1, 2]);

            store().updateSelectedShapes({
                strokeWidth: 6,
                strokeColor: "#ff0000",
            });

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
                rotation: 0,
                strokeWidth: 6,
                strokeColor: "#ff0000",
            });
            expect(store().shapes.get(2)?.strokeWidth).toEqual(6);
            expect(store().shapes.get(2)?.strokeColor).toEqual("#ff0000");
        });

        test("preserves the other shape properties", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);

            store().updateSelectedShapes({ strokePattern: "dotted" });

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
                rotation: Math.PI / 3,
                strokePattern: "dotted",
            });
        });

        test("is a no-op when nothing is selected", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));

            store().updateSelectedShapes({ strokeWidth: 6 });

            expect(store().shapes.get(1)?.strokeWidth).toBeUndefined();
        });

        test("ignores selected ids that do not exist", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([999]);

            store().updateSelectedShapes({ strokeWidth: 6 });

            expect(store().shapes.get(1)?.strokeWidth).toBeUndefined();
        });

        test("keeps the spatial index in sync", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().updateSelectedShapes({ strokeWidth: 8 });

            expect(store().shapeIndex.all()).toEqual([
                { minX: 0, minY: 0, maxX: 10, maxY: 10, id: 1 },
            ]);
        });
    });

    describe("deleteShapes", () => {
        test("removes the deleted shapes from the map", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().addShape(makeShape(3, { x: 40, y: 40 }, { x: 50, y: 50 }));

            store().deleteShapes([1, 2]);

            expect(store().shapes.has(1)).toBe(false);
            expect(store().shapes.has(2)).toBe(false);
            expect(store().shapes.has(3)).toBe(true);
        });

        test("prunes the deleted shapes from the spatial index", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().addShape(makeShape(3, { x: 40, y: 40 }, { x: 50, y: 50 }));

            store().deleteShapes([1, 2]);

            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
            ).toEqual([3]);
        });

        test("prunes deleted ids from the selection", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1, 2]);

            store().deleteShapes([1, 2]);

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
        test("moves only the selected shapes", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1]);

            store().moveSelectedShapes(5, 5);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 5, y: 5 },
                to: { x: 15, y: 15 },
                rotation: 0,
            });
            expect(store().shapes.get(2)).toEqual({
                id: 2,
                type: Tools.rect,
                from: { x: 20, y: 20 },
                to: { x: 30, y: 30 },
                rotation: 0,
            });
        });

        test("keeps the spatial index in sync after moving", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1]);

            store().moveSelectedShapes(5, 5);

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

        test("preserves rotation while moving", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);

            store().moveSelectedShapes(5, 5);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 5, y: 5 },
                to: { x: 15, y: 15 },
                rotation: Math.PI / 3,
            });
        });

        test("is a no-op when the selected id does not exist", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([999]);

            store().moveSelectedShapes(5, 5);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
                rotation: 0,
            });
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
        test("adds ids to the selection when multi is true", () => {
            store().toggleSelectedIds(1, true);
            store().toggleSelectedIds(2, true);

            expect(store().selectedIds).toEqual([1, 2]);
        });

        test("removes ids from the selection when multi is true", () => {
            store().toggleSelectedIds(1, true);
            store().toggleSelectedIds(2, true);
            store().toggleSelectedIds(1, true);

            expect(store().selectedIds).toEqual([2]);
        });

        test("replaces the whole selection when multi is false", () => {
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

    describe("setCurrentShape", () => {
        test("sets the in-progress shape", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().setCurrentShape(shape);

            expect(store().currentShape).toEqual(shape);
        });

        test("clears the in-progress shape with null", () => {
            store().setCurrentShape(
                makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 })
            );
            store().setCurrentShape(null);

            expect(store().currentShape).toBeNull();
        });
    });

    describe("setSelectedIds", () => {
        test("replaces the whole selection", () => {
            store().setSelectedIds([1]);
            store().setSelectedIds([2, 3]);

            expect(store().selectedIds).toEqual([2, 3]);
        });
    });

    describe("setSelectionBox", () => {
        test("sets the selection box", () => {
            store().setSelectionBox({
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            });

            expect(store().selectionBox).toEqual({
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            });
        });

        test("clears the selection box with null", () => {
            store().setSelectionBox({
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            });
            store().setSelectionBox(null);

            expect(store().selectionBox).toBeNull();
        });
    });

    describe("flags and viewport setters", () => {
        test("setIsBoxSelecting updates the flag", () => {
            store().setIsBoxSelecting(true);
            expect(store().isBoxSelecting).toBe(true);
        });

        test("setIsDragging updates the flag", () => {
            store().setIsDragging(true);
            expect(store().isDragging).toBe(true);
        });

        test("setIsPanning updates the flag", () => {
            store().setIsPanning(true);
            expect(store().isPanning).toBe(true);
        });

        test("setOffset updates the viewport offset", () => {
            store().setOffset({ x: 100, y: 200 });
            expect(store().offset).toEqual({ x: 100, y: 200 });
        });

        test("setScale updates the zoom scale", () => {
            store().setScale(2.5);
            expect(store().scale).toEqual(2.5);
        });

        test("setLastPos updates the last pointer position", () => {
            store().setLastPos({ x: 50, y: 60 });
            expect(store().lastPos).toEqual({ x: 50, y: 60 });
        });

        test("setStartWorldPos updates the drag start position", () => {
            store().setStartWorldPos({ x: 1, y: 2 });
            expect(store().startWorldPos).toEqual({ x: 1, y: 2 });
        });
    });

    describe("updateShape with rotation", () => {
        test("re-indexes the spatial index for the rotated bounds", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 }));
            store().updateShape(1, { rotation: Math.PI / 2 });

            const item = store().shapeIndex.all()[0];
            expect(item.id).toEqual(1);
            expect(item.minX).toBeCloseTo(25);
            expect(item.minY).toBeCloseTo(-25);
            expect(item.maxX).toBeCloseTo(75);
            expect(item.maxY).toBeCloseTo(75);
        });
    });

    describe("copySelectedShapes", () => {
        test("deep-clones the selected shapes into the clipboard", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().copySelectedShapes();

            expect(store().clipboard).toEqual([
                {
                    id: 1,
                    type: Tools.rect,
                    from: { x: 0, y: 0 },
                    to: { x: 10, y: 10 },
                    rotation: 0,
                },
            ]);
            store().clipboard[0].from.x = 999;
            expect(store().shapes.get(1)?.from.x).toEqual(0);
        });

        test("preserves the selection order in the clipboard", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([2, 1]);

            store().copySelectedShapes();

            expect(store().clipboard.map(shape => shape.id)).toEqual([2, 1]);
        });

        test("is a no-op when nothing is selected", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));

            store().copySelectedShapes();

            expect(store().clipboard).toEqual([]);
        });
    });

    describe("duplicateSelectedShapes", () => {
        test("duplicates the selected shape with a 10px offset", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(store().shapes.size).toEqual(2);
            expect(store().shapes.get(2)).toEqual({
                id: 2,
                type: Tools.rect,
                from: { x: 10, y: 10 },
                to: { x: 20, y: 20 },
                rotation: 0,
            });
        });

        test("selects the duplicated shape", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(store().selectedIds).toEqual([2]);
        });

        test("keeps the spatial index in sync after duplicating", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
                    .sort()
            ).toEqual([1, 2]);
        });

        test("duplicates all selected shapes", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 }));
            store().setSelectedIds([1, 2]);

            store().duplicateSelectedShapes();

            expect(store().shapes.size).toEqual(4);
            expect(store().shapes.get(3)?.from).toEqual({ x: 10, y: 10 });
            expect(store().shapes.get(4)?.from).toEqual({ x: 30, y: 30 });
            expect(new Set(store().selectedIds)).toEqual(new Set([3, 4]));
        });

        test("preserves the rotation of the duplicated shape", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(store().shapes.get(2)?.rotation).toBeCloseTo(Math.PI / 3);
        });

        test("is a no-op when nothing is selected", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));

            store().duplicateSelectedShapes();

            expect(store().shapes.size).toEqual(1);
            expect(store().selectedIds).toEqual([]);
        });
    });

    describe("pasteShapes", () => {
        test("pastes the clipboard centered on the target and selects the pasted shapes", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.size).toEqual(2);
            expect(store().shapes.get(2)).toEqual({
                id: 2,
                type: Tools.rect,
                from: { x: 95, y: 95 },
                to: { x: 105, y: 105 },
                rotation: 0,
            });
            expect(store().selectedIds).toEqual([2]);
            expect(
                store().shapeIndex.search({
                    minX: 96,
                    minY: 96,
                    maxX: 104,
                    maxY: 104,
                })
            ).toEqual([{ minX: 95, minY: 95, maxX: 105, maxY: 105, id: 2 }]);
        });

        test("centers the whole selection on the target", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().addShape(makeShape(2, { x: 30, y: 30 }, { x: 40, y: 40 }));
            store().setSelectedIds([1, 2]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(3)?.from).toEqual({ x: 80, y: 80 });
            expect(store().shapes.get(4)?.from).toEqual({ x: 110, y: 110 });
        });

        test("repeated pastes to the same target all center on it", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });
            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(2)?.from).toEqual({ x: 95, y: 95 });
            expect(store().shapes.get(3)?.from).toEqual({ x: 95, y: 95 });
        });

        test("preserves the rotation of the pasted shape", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(2)?.rotation).toBeCloseTo(Math.PI / 3);
        });

        test("is a no-op when the clipboard is empty", () => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.size).toEqual(1);
            expect(store().selectedIds).toEqual([]);
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
