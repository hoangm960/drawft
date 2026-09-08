import { renderHook, act } from "@testing-library/react";
import { useBoardSaver } from "../useBoardSaver";
import { useCanvasStore } from "@stores/useCanvasStore";
import { saveBoard } from "@/utils/boardStorage";
import { makeShape } from "@/test/factories";

jest.mock("@/utils/boardStorage", () => ({
    ...jest.requireActual("@/utils/boardStorage"),
    saveBoard: jest.fn(),
}));

const mockedSaveBoard = saveBoard as jest.Mock;

describe("useBoardSaver", () => {
    beforeEach(() => {
        useCanvasStore.getState().reset();
        mockedSaveBoard.mockClear();
    });

    test("should initialize with a saved status", () => {
        const { result } = renderHook(() => useBoardSaver());
        expect(result.current.status).toBe("saved");
        expect(result.current.savedAt).toBeNull();
        expect(result.current.isDirty).toBe(false);
    });

    test("should mark as dirty", () => {
        const { result } = renderHook(() => useBoardSaver());
        act(() => {
            result.current.markAsDirty();
        });
        expect(result.current.status).toBe("unsaved");
        expect(result.current.isDirty).toBe(true);
    });

    test("should persist the board and update status", async () => {
        jest.useFakeTimers();
        const shape = makeShape(1, { x: 0, y: 0 }, { x: 10, y: 10 });
        useCanvasStore.getState().addShape(shape);
        mockedSaveBoard.mockReturnValue(true);
        const { result } = renderHook(() => useBoardSaver());

        act(() => {
            result.current.persist();
        });

        expect(result.current.status).toBe("saving");

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(mockedSaveBoard).toHaveBeenCalled();
        expect(result.current.status).toBe("saved");
        expect(result.current.savedAt).not.toBeNull();
        expect(result.current.isDirty).toBe(false);
        jest.useRealTimers();
    });

    test("should set status to error if persist fails", async () => {
        jest.useFakeTimers();
        mockedSaveBoard.mockReturnValue(false);
        const { result } = renderHook(() => useBoardSaver());

        act(() => {
            result.current.persist();
        });

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        expect(result.current.status).toBe("error");
        expect(result.current.savedAt).toBeNull();
        jest.useRealTimers();
    });
});
