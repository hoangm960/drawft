import { test, expect } from "@playwright/test";

test.describe("App Boot & UI", () => {
    test("loads app and displays main UI components", async ({ page }) => {
        await page.goto("/");

        // Check canvas
        const canvas = page.locator("canvas#whiteboard");
        await expect(canvas).toBeVisible();

        // Check Toolbar (has buttons)
        const toolbar = page.locator("button[title^='Rectangle']");
        await expect(toolbar).toBeVisible();

        // Check Sidebar
        const strokeText = page.locator("text=Stroke");
        await expect(strokeText).toBeVisible();

        // Check BoardStatus
        const zoomText = page.locator("text=100%");
        await expect(zoomText).toBeVisible();
    });

    test("default tool is Select and canvas has no grab cursor", async ({
        page,
    }) => {
        await page.goto("/");

        const selectBtn = page.locator("button[title^='Select']");
        await expect(selectBtn).toHaveClass(/bg-gray-200|bg-gray-500/); // active class

        const canvas = page.locator("canvas#whiteboard");
        await expect(canvas).not.toHaveClass(/cursor-grab/);
        await expect(canvas).not.toHaveClass(/cursor-crosshair/);
    });
});
