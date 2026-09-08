import { act, fireEvent, render, screen } from "@testing-library/react";
import BoardStatus from "../BoardStatus";
import { useCanvasStore } from "@stores/useCanvasStore";
import { makeShape } from "@/test/factories";
import { saveBoard } from "@/utils/boardStorage";

const store = () => useCanvasStore.getState();

describe("BoardStatus", () => {
    beforeEach(() => {
        localStorage.clear();
        store().reset();
    });

    test("renders nothing before the first save or load", () => {
        render(<BoardStatus />);
        expect(screen.queryByRole("status")).toBeNull();
    });

    test("hydrates the store from localStorage and shows the saved state", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        saveBoard(new Map([[1, shape]]), { x: 3, y: 4 }, 2);

        render(<BoardStatus />);

        expect(store().shapes.get(1)).toEqual(shape);
        expect(store().offset).toEqual({ x: 3, y: 4 });
        expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    });

    test("marks the board as unsaved without writing to storage", () => {
        render(<BoardStatus />);
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });

        act(() => {
            store().addShape(shape);
        });

        expect(screen.getByRole("status").textContent).toMatch(
            /Unsaved changes/
        );
        expect(localStorage.getItem("drawft:board:v1")).toBeNull();
    });

    test("ctrl+s saves immediately", () => {
        render(<BoardStatus />);
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });

        act(() => {
            store().addShape(shape);
        });
        expect(localStorage.getItem("drawft:board:v1")).toBeNull();

        act(() => {
            fireEvent.keyDown(window, { key: "s", ctrlKey: true });
        });
        expect(localStorage.getItem("drawft:board:v1")).toContain('"id":1');
        expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    });

    test("ignores ctrl+s from text inputs", () => {
        render(
            <>
                <BoardStatus />
                <input aria-label="name" />
            </>
        );

        act(() => {
            fireEvent.keyDown(screen.getByLabelText("name"), {
                key: "s",
                ctrlKey: true,
            });
        });
        expect(screen.queryByRole("status")).toBeNull();
        expect(localStorage.getItem("drawft:board:v1")).toBeNull();
    });
});
