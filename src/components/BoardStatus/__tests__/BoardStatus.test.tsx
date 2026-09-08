import { act, fireEvent, render, screen } from "@testing-library/react";
import BoardStatus from "../BoardStatus";
import { useCanvasStore } from "@stores/useCanvasStore";
import { makeShape } from "@/test/factories";
import { saveBoard } from "@/utils/boardStorage";
import { useSettingsStore } from "@stores/useSettingsStore";

jest.mock("@/utils/boardStorage", () => ({
    ...jest.requireActual("@/utils/boardStorage"),
    saveBoard: jest.fn(),
}));

const mockedSaveBoard = saveBoard as jest.Mock;
const store = () => useCanvasStore.getState();

describe("BoardStatus", () => {
    beforeEach(() => {
        localStorage.clear();
        store().reset();
        useSettingsStore.getState().setAutosave(false);
        mockedSaveBoard.mockClear();
        mockedSaveBoard.mockReturnValue(true);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("hydrates the store from localStorage and shows the saved state", () => {
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        // Manually mock the loadBoard functionality for this test
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
            JSON.stringify({
                version: 1,
                shapes: [shape],
                offset: { x: 3, y: 4 },
                scale: 2,
            })
        );

        render(<BoardStatus />);

        expect(store().shapes.get(1)).toEqual(shape);
        expect(store().offset).toEqual({ x: 3, y: 4 });
    });

    test("marks the board as unsaved when changes are made", () => {
        render(<BoardStatus />);
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });

        act(() => {
            store().addShape(shape);
        });

        expect(screen.getByRole("status").textContent).toMatch(/Unsaved/);
        expect(mockedSaveBoard).not.toHaveBeenCalled();
    });

    test("ctrl+s saves immediately", async () => {
        render(<BoardStatus />);
        act(() => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        });
        expect(mockedSaveBoard).not.toHaveBeenCalled();

        act(() => {
            fireEvent.keyDown(window, { key: "s", ctrlKey: true });
        });

        expect(screen.getByRole("status").textContent).toMatch(/Saving/);

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(mockedSaveBoard).toHaveBeenCalled();
        expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    });

    test("autosaves after a delay when enabled", async () => {
        useSettingsStore.getState().setAutosave(true);
        render(<BoardStatus />);

        act(() => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        });
        expect(mockedSaveBoard).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.getByRole("status").textContent).toMatch(/Saving/);

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(mockedSaveBoard).toHaveBeenCalled();
        expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    });

    test("does not autosave when disabled", () => {
        render(<BoardStatus />);
        act(() => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        });

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(mockedSaveBoard).not.toHaveBeenCalled();
        expect(screen.getByRole("status").textContent).toMatch(/Unsaved/);
    });

    test("autosaves by interval when enabled", async () => {
        useSettingsStore.getState().setAutosave(true);
        useSettingsStore.getState().setAutosaveMethod("interval");
        useSettingsStore.getState().setAutosaveInterval(5000);
        render(<BoardStatus />);

        act(() => {
            store().addShape(makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 }));
        });
        expect(mockedSaveBoard).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        expect(screen.getByRole("status").textContent).toMatch(/Saving/);

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(mockedSaveBoard).toHaveBeenCalled();
        expect(screen.getByRole("status").textContent).toMatch(/Saved/);
    });
});
