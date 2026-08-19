import { Tools } from "@/types";
import { useTool } from "../useToolStore";

describe("useTool", () => {
    beforeEach(() => {
        useTool.getState().setTool(Tools.select);
    });

    test("starts with the select tool", () => {
        expect(useTool.getState().tool).toEqual(Tools.select);
    });

    test("setTool updates the active tool", () => {
        useTool.getState().setTool(Tools.rect);
        expect(useTool.getState().tool).toEqual(Tools.rect);
    });
});
