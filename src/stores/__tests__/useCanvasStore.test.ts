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
            const shape = makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 });
            store().addShape(shape);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 100, y: 100 },
                to: { x: 200, y: 300 },
                rotation: 0,
            });
        });

        test("indexes the shape bbox for hit-testing", () => {
            const shape = makeShape(1, { x: 100, y: 100 }, { x: 200, y: 300 });
            store().addShape(shape);

            expect(store().shapeIndex.all()).toEqual([
                { minX: 100, minY: 100, maxX: 200, maxY: 300, id: 1 },
            ]);
        });
    });

    describe("updateShape", () => {
        test("updates the shape in the map", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const updates = {
                from: { x: 100, y: 100 },
                to: { x: 110, y: 110 },
            };
            store().addShape(shape);
            store().updateShape(1, updates);

            expect(store().shapes.get(1)).toEqual({
                id: 1,
                type: Tools.rect,
                from: { x: 100, y: 100 },
                to: { x: 110, y: 110 },
                rotation: 0,
            });
        });

        test("re-indexes the shape bbox on update", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const updates = {
                from: { x: 100, y: 100 },
                to: { x: 110, y: 110 },
            };
            store().addShape(shape);
            store().updateShape(1, updates);

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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            const updates = {
                strokeWidth: 6,
                strokeColor: "#ff0000",
            };
            store().addShape(shape1);
            store().addShape(shape2);
            store().setSelectedIds([1, 2]);

            store().updateSelectedShapes(updates);

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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().updateSelectedShapes({ strokeWidth: 6 });

            expect(store().shapes.get(1)?.strokeWidth).toBeUndefined();
        });

        test("ignores selected ids that do not exist", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([999]);

            store().updateSelectedShapes({ strokeWidth: 6 });

            expect(store().shapes.get(1)?.strokeWidth).toBeUndefined();
        });

        test("keeps the spatial index in sync", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);

            store().updateSelectedShapes({ strokeWidth: 8 });

            expect(store().shapeIndex.all()).toEqual([
                { minX: 0, minY: 0, maxX: 10, maxY: 10, id: 1 },
            ]);
        });
    });

    describe("deleteShapes", () => {
        test("removes the deleted shapes from the map", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            const shape3 = makeShape(3, { x: 40, y: 40 }, { x: 50, y: 50 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().addShape(shape3);

            store().deleteShapes([1, 2]);

            expect(store().shapes.has(1)).toBe(false);
            expect(store().shapes.has(2)).toBe(false);
            expect(store().shapes.has(3)).toBe(true);
        });

        test("prunes the deleted shapes from the spatial index", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            const shape3 = makeShape(3, { x: 40, y: 40 }, { x: 50, y: 50 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().addShape(shape3);

            store().deleteShapes([1, 2]);

            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
            ).toEqual([3]);
        });

        test("prunes deleted ids from the selection", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().setSelectedIds([1, 2]);

            store().deleteShapes([1, 2]);

            expect(store().selectedIds).toEqual([]);
        });

        test("ignores ids that do not exist", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().deleteShapes([1, 999]);

            expect(store().shapes.size).toEqual(0);
            expect(store().shapeIndex.all()).toEqual([]);
        });
    });

    describe("moveSelectedShapes", () => {
        test("moves only the selected shapes", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 100, y: 100 }, { x: 110, y: 110 });
            const shape3 = makeShape(3, { x: 20, y: 20 }, { x: 30, y: 30 });
            const selectionBox = {
                from: { x: 5, y: 5 },
                to: { x: 25, y: 25 },
            };
            store().addShape(shape1);
            store().addShape(shape2);
            store().addShape(shape3);
            store().setSelectionBox(selectionBox);

            store().selectShapesInBox();

            expect(new Set(store().selectedIds)).toEqual(new Set([1, 3]));
        });

        test("is a no-op when there is no selection box", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            const shape3 = makeShape(5, { x: 40, y: 40 }, { x: 50, y: 50 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().addShape(shape3);

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
            const box = {
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            };
            store().setSelectionBox(box);

            expect(store().selectionBox).toEqual({
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            });
        });

        test("clears the selection box with null", () => {
            const box = {
                from: { x: 0, y: 0 },
                to: { x: 10, y: 10 },
            };
            store().setSelectionBox(box);
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
            const offset = { x: 100, y: 200 };
            store().setOffset(offset);

            expect(store().offset).toEqual({ x: 100, y: 200 });
        });

        test("setScale updates the zoom scale", () => {
            store().setScale(2.5);
            expect(store().scale).toEqual(2.5);
        });

        test("setLastPos updates the last pointer position", () => {
            const pos = { x: 50, y: 60 };
            store().setLastPos(pos);

            expect(store().lastPos).toEqual({ x: 50, y: 60 });
        });

        test("setStartWorldPos updates the drag start position", () => {
            const pos = { x: 1, y: 2 };
            store().setStartWorldPos(pos);

            expect(store().startWorldPos).toEqual({ x: 1, y: 2 });
        });
    });

    describe("updateShape with rotation", () => {
        test("re-indexes the spatial index for the rotated bounds", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 100, y: 50 });
            store().addShape(shape);
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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().setSelectedIds([2, 1]);

            store().copySelectedShapes();

            expect(store().clipboard.map(shape => shape.id)).toEqual([2, 1]);
        });

        test("is a no-op when nothing is selected", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().copySelectedShapes();

            expect(store().clipboard).toEqual([]);
        });
    });

    describe("duplicateSelectedShapes", () => {
        test("duplicates the selected shape with a 10px offset", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(store().selectedIds).toEqual([2]);
        });

        test("keeps the spatial index in sync after duplicating", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().setSelectedIds([1, 2]);

            store().duplicateSelectedShapes();

            expect(store().shapes.size).toEqual(4);
            expect(store().shapes.get(3)?.from).toEqual({ x: 10, y: 10 });
            expect(store().shapes.get(4)?.from).toEqual({ x: 30, y: 30 });
            expect(new Set(store().selectedIds)).toEqual(new Set([3, 4]));
        });

        test("preserves the rotation of the duplicated shape", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);

            store().duplicateSelectedShapes();

            expect(store().shapes.get(2)?.rotation).toBeCloseTo(Math.PI / 3);
        });

        test("is a no-op when nothing is selected", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().duplicateSelectedShapes();

            expect(store().shapes.size).toEqual(1);
            expect(store().selectedIds).toEqual([]);
        });
    });

    describe("pasteShapes", () => {
        test("pastes the clipboard centered on the target and selects the pasted shapes", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
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
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 30, y: 30 }, { x: 40, y: 40 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().setSelectedIds([1, 2]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(3)?.from).toEqual({ x: 80, y: 80 });
            expect(store().shapes.get(4)?.from).toEqual({ x: 110, y: 110 });
        });

        test("repeated pastes to the same target all center on it", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });
            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(2)?.from).toEqual({ x: 95, y: 95 });
            expect(store().shapes.get(3)?.from).toEqual({ x: 95, y: 95 });
        });

        test("preserves the rotation of the pasted shape", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().updateShape(1, { rotation: Math.PI / 3 });
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.get(2)?.rotation).toBeCloseTo(Math.PI / 3);
        });

        test("is a no-op when the clipboard is empty", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().pasteShapes({ x: 100, y: 100 });

            expect(store().shapes.size).toEqual(1);
            expect(store().selectedIds).toEqual([]);
        });
    });

    describe("reset", () => {
        test("restores the initial state", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const offset = { x: 100, y: 100 };
            store().addShape(shape);
            store().setSelectedIds([1]);
            store().setScale(2);
            store().setOffset(offset);
            store().setCurrentShape(shape);

            store().reset();

            expect(store().shapes.size).toEqual(0);
            expect(store().shapeIndex.all()).toEqual([]);
            expect(store().selectedIds).toEqual([]);
            expect(store().scale).toEqual(1);
            expect(store().offset).toEqual({ x: 0, y: 0 });
            expect(store().currentShape).toBeNull();
        });
    });

    describe("undo", () => {
        test("reverts the last change", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().undo();

            expect(store().shapes.size).toEqual(0);
        });

        test("moves the undone state into the future stack", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().undo();

            expect(store().future).toHaveLength(1);
            expect(store().future[0].get(1)).toEqual(shape);
        });

        test("rebuilds the spatial index from the restored shapes", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().undo();

            expect(store().shapeIndex.all()).toEqual([]);

            store().redo();

            expect(store().shapeIndex.all()).toEqual([
                { minX: 0, minY: 0, maxX: 10, maxY: 10, id: 1 },
            ]);
        });

        test("clears the selection", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);

            store().undo();

            expect(store().selectedIds).toEqual([]);
        });

        test("is a no-op when there is no history", () => {
            store().undo();

            expect(store().shapes.size).toEqual(0);
            expect(store().past).toEqual([]);
            expect(store().future).toEqual([]);
        });

        test("restores deleted shapes", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().deleteShapes([1]);

            store().undo();

            expect(store().shapes.has(1)).toBe(true);
            expect(store().shapes.has(2)).toBe(true);
            expect(
                store()
                    .shapeIndex.all()
                    .map(item => item.id)
                    .sort()
            ).toEqual([1, 2]);
        });

        test("reverts style changes", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            const snapshot = store().shapes;
            store().updateSelectedShapes({
                strokeWidth: 8,
                strokeColor: "#f00",
            });
            store().commitHistory(snapshot);

            store().undo();

            expect(store().shapes.get(1)?.strokeWidth).toBeUndefined();
            expect(store().shapes.get(1)?.strokeColor).toBeUndefined();
        });

        test("reverts pasted and duplicated shapes", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            store().copySelectedShapes();

            store().pasteShapes({ x: 100, y: 100 });
            expect(store().shapes.size).toEqual(2);
            store().undo();
            expect(store().shapes.size).toEqual(1);

            store().setSelectedIds([1]);
            store().duplicateSelectedShapes();
            expect(store().shapes.size).toEqual(2);
            store().undo();
            expect(store().shapes.size).toEqual(1);
        });

        test("does not record history for no-op updates", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().updateShape(999, { to: { x: 50, y: 50 } });

            expect(store().past).toHaveLength(1);
        });
    });

    describe("redo", () => {
        test("re-applies an undone change", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().undo();

            store().redo();

            expect(store().shapes.get(1)).toEqual(shape);
        });

        test("is a no-op when there is nothing to redo", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);

            store().redo();

            expect(store().shapes.size).toEqual(1);
        });

        test("clears the redo stack when a new change happens", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().undo();
            expect(store().future).toHaveLength(1);

            store().addShape(shape2);

            expect(store().future).toEqual([]);
            store().redo();
            expect(store().shapes.get(2)).toEqual(shape2);
        });

        test("clears the selection", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            store().undo();
            store().setSelectedIds([1]);

            store().redo();

            expect(store().selectedIds).toEqual([]);
        });
    });

    describe("gesture mutations and commitHistory", () => {
        test("moveSelectedShapes does not record history directly", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            const pastLength = store().past.length;

            store().moveSelectedShapes(5, 5);
            store().moveSelectedShapes(3, 3);

            expect(store().past.length - pastLength).toEqual(0);
        });

        test("updateShape does not record history directly", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            const pastLength = store().past.length;

            store().updateShape(1, { rotation: Math.PI / 2 });

            expect(store().past.length - pastLength).toEqual(0);
        });

        test("updateSelectedShapes does not record history directly", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);
            const pastLength = store().past.length;

            store().updateSelectedShapes({ strokeWidth: 8 });

            expect(store().past.length - pastLength).toEqual(0);
        });

        test("commitHistory pushes a snapshot and clears the redo stack", () => {
            const shape1 = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            const shape2 = makeShape(2, { x: 20, y: 20 }, { x: 30, y: 30 });
            store().addShape(shape1);
            store().addShape(shape2);
            store().undo();
            expect(store().future).toHaveLength(1);
            const pastLength = store().past.length;

            store().commitHistory(new Map(store().shapes));

            expect(store().future).toEqual([]);
            expect(store().past).toHaveLength(pastLength + 1);
        });

        test("undo after commitHistory restores the committed snapshot", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().setSelectedIds([1]);

            const snapshot = store().shapes;
            store().moveSelectedShapes(5, 5);
            store().moveSelectedShapes(3, 3);
            store().commitHistory(snapshot);

            store().undo();

            expect(store().shapes.get(1)).toEqual(shape);
        });
    });

    describe("history and reset", () => {
        test("reset clears the history stacks", () => {
            const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
            store().addShape(shape);
            store().undo();

            store().reset();

            expect(store().past).toEqual([]);
            expect(store().future).toEqual([]);
        });
    });
});
