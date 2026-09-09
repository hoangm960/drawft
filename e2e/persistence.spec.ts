import { test, expect } from "@playwright/test";

test.describe("Persistence", () => {
    test("saves and loads board from localStorage", async ({ page }) => {
        await page.goto("/");

        // Draw shape
        await page.locator("button[title='Rectangle']").click();
        const canvas = page.locator("canvas#whiteboard");
        await canvas.dragTo(canvas, {
            sourcePosition: { x: 400, y: 100 },
            targetPosition: { x: 500, y: 200 },
        });

        // Trigger manual save
        await page.keyboard.press("Control+s");

        // Wait for localStorage item to exist
        await page.waitForFunction(() => {
            return localStorage.getItem("drawft:board:v1") !== null;
        });

        // Reload page
        await page.reload();

        // Verify shape exists
        const shapesSize = await page.evaluate(() => {
            return window.useCanvasStore.getState().shapes.size;
        });
        expect(shapesSize).toBe(1);
    });
});
