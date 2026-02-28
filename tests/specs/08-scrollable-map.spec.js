import { test, expect } from '@playwright/test';
import { waitForGameReady } from '../helpers/gameHelper.js';

test.describe('Scrollable Map', () => {
    test('camera starts at top-left of grass area', async ({ page }) => {
        await waitForGameReady(page);

        const initial = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(initial.scrollX).toBe(64);
        expect(initial.scrollY).toBe(64);
        expect(initial.viewportWidth).toBe(1152);
        expect(initial.viewportHeight).toBe(640);

        const after = await page.evaluate(() => window.gameAPI.scrollCamera(200, 100));
        expect(after.scrollX).toBe(264);
        expect(after.scrollY).toBe(164);
    });

    test('camera respects world bounds', async ({ page }) => {
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.scrollCamera(9999, 9999));
        const state = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera bounds: max scrollX = 64 + 2432 - 1152 = 1344, max scrollY = 64 + 1408 - 640 = 832
        expect(state.scrollX).toBeLessThanOrEqual(1344);
        expect(state.scrollY).toBeLessThanOrEqual(832);
    });

    test('keyboard arrow keys scroll the camera', async ({ page }) => {
        await waitForGameReady(page);

        const before = await page.evaluate(() => window.gameAPI.getCameraState());
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowRight');

        const after = await page.evaluate(() => window.gameAPI.getCameraState());
        expect(after.scrollX).toBeGreaterThan(before.scrollX);
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
