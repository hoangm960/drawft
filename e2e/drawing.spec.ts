import { test, expect } from "@playwright/test";

test.describe("Drawing", () => {
    test("draws a rectangle and updates state", async ({ page }) => {
        await page.goto("/");

        // Select Rect tool
        await page.locator("button[title='Rectangle']").click();

        const canvas = page.locator("canvas#whiteboard");

        // Draw Rect
        await canvas.dragTo(canvas, {
            sourcePosition: { x: 400, y: 100 },
            targetPosition: { x: 600, y: 300 },
        });

        // Assert state size
        const shapesSize = await page.evaluate(() => {
            return window.useCanvasStore.getState().shapes.size;
        });
        expect(shapesSize).toBe(1);

        // Visual snapshot
        // We'll mask sidebar and toolbar if needed, or just capture full page
        await expect(page).toHaveScreenshot("drawn-rectangle.png");
    });
});
