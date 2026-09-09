import { test, expect } from "@playwright/test";

test.describe("Manipulation", () => {
    test("moves and resizes a shape", async ({ page }) => {
        await page.goto("/");

        await page.locator("button[title^='Rectangle']").click();
        const canvas = page.locator("canvas#whiteboard");
        await canvas.dragTo(canvas, {
            sourcePosition: { x: 400, y: 100 },
            targetPosition: { x: 500, y: 200 },
        });

        // Switch to select tool
        await page.locator("button[title^='Select']").click();

        // Select the shape (click in middle)
        await page.mouse.click(450, 150);

        // Verify it is selected
        const selectedIds = await page.evaluate(() => {
            return window.useCanvasStore.getState().selectedIds;
        });
        expect(selectedIds.length).toBe(1);

        // Drag to move
        await page.mouse.move(450, 150);
        await page.mouse.down();
        await page.mouse.move(550, 250);
        await page.mouse.up();

        // Assert moved
        let shape = await page.evaluate(() => {
            const store = window.useCanvasStore.getState();
            return store.shapes.get(store.selectedIds[0]);
        });
        expect(shape.from.x).toBe(500);
        expect(shape.from.y).toBe(200);
        expect(shape.to.x).toBe(600);
        expect(shape.to.y).toBe(300);

        // Resize from bottom-right handle (near 600, 300)
        await page.mouse.move(600, 300);
        await page.mouse.down();
        await page.mouse.move(650, 350);
        await page.mouse.up();

        // Assert resized
        shape = await page.evaluate(() => {
            const store = window.useCanvasStore.getState();
            return store.shapes.get(store.selectedIds[0]);
        });
        expect(shape.to.x).toBe(650);
        expect(shape.to.y).toBe(350);
    });
});
