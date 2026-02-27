import { test, expect } from '@playwright/test';
import { waitForGameReady } from '../helpers/gameHelper.js';

test.describe('Scrollable Map', () => {
    test('camera starts at top-left and can scroll', async ({ page }) => {
        await waitForGameReady(page);

        // Camera should start at (0, 0)
        const initial = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(initial.scrollX).toBe(0);
        expect(initial.scrollY).toBe(0);
        expect(initial.viewportWidth).toBe(1280);
        expect(initial.viewportHeight).toBe(768);

        // Scroll right and down
        const after = await page.evaluate(() => window.gameAPI.scrollCamera(200, 100));
        expect(after.scrollX).toBe(200);
        expect(after.scrollY).toBe(100);
    });

    test('camera respects world bounds', async ({ page }) => {
        await waitForGameReady(page);

        // Scroll far beyond world bounds
        await page.evaluate(() => window.gameAPI.scrollCamera(9999, 9999));
        const state = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera bounds: max scrollX = 2560 - 1280 = 1280, max scrollY = 1536 - 768 = 768
        expect(state.scrollX).toBeLessThanOrEqual(1280);
        expect(state.scrollY).toBeLessThanOrEqual(768);
    });

    test('keyboard arrow keys scroll the camera', async ({ page }) => {
        await waitForGameReady(page);

        // Hold right arrow for 500ms
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowRight');

        const state = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(state.scrollX).toBeGreaterThan(0);
    });

    test('map has expanded grid (40x24)', async ({ page }) => {
        await waitForGameReady(page);

        const gridInfo = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const grid = scene.gridSystem.grid;
            return { rows: grid.length, cols: grid[0].length };
        });

        expect(gridInfo.rows).toBe(24);
        expect(gridInfo.cols).toBe(40);
    });
});
