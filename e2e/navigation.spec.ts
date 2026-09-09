import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
    test("panning and zooming", async ({ page }) => {
        await page.goto("/");

        // Pan
        await page.locator("button[title='Pan']").click();
        const canvas = page.locator("canvas#whiteboard");

        await page.mouse.move(400, 100);
        await page.mouse.down();
        await page.mouse.move(500, 150);
        await page.mouse.up();

        const offset = await page.evaluate(() => {
            return window.useCanvasStore.getState().offset;
        });
        expect(offset.x).toBe(100);
        expect(offset.y).toBe(50);

        // Zoom out (scroll down)
        await canvas.dispatchEvent("wheel", {
            deltaY: 100,
            clientX: 400,
            clientY: 200,
        });

        // Wait for state to settle
        await page.waitForFunction(() => {
            return window.useCanvasStore.getState().scale < 1;
        });

        const scale = await page.evaluate(() => {
            return window.useCanvasStore.getState().scale;
        });
        expect(scale).toBeLessThan(1);
    });
});
