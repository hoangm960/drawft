import { test, expect } from "@playwright/test";

test.describe("Shortcuts", () => {
    test("delete, undo, duplicate workflows", async ({ page }) => {
        await page.goto("/");

        // Draw shape
        await page.locator("button[title^='Rectangle']").click();
        const canvas = page.locator("canvas#whiteboard");
        await canvas.dragTo(canvas, {
            sourcePosition: { x: 400, y: 100 },
            targetPosition: { x: 500, y: 200 },
        });

        // Select it
        await page.locator("button[title^='Select']").click();
        await page.mouse.click(450, 150);

        // Delete
        await page.keyboard.press("Delete");
        let shapesSize = await page.evaluate(() => {
            return window.useCanvasStore.getState().shapes.size;
        });
        expect(shapesSize).toBe(0);

        // Undo
        await page.keyboard.press("Control+z");
        shapesSize = await page.evaluate(() => {
            return window.useCanvasStore.getState().shapes.size;
        });
        expect(shapesSize).toBe(1);

        // Select again (undo clears selection)
        await page.mouse.click(450, 150);

        // Duplicate
        await page.keyboard.press("Control+d");
        shapesSize = await page.evaluate(() => {
            return window.useCanvasStore.getState().shapes.size;
        });
        expect(shapesSize).toBe(2);
    });
});
