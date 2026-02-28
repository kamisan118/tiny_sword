import { test, expect } from '@playwright/test';
import { waitForGameReady } from '../helpers/gameHelper.js';

test.describe('Scrollable Map', () => {
    test('camera starts centered on castle', async ({ page }) => {
        await waitForGameReady(page);

        const initial = await page.evaluate(() => window.gameAPI.getCameraState());
        // Castle center at (1248, 768), full viewport 1280x768 → scroll = (608, 384)
        expect(initial.scrollX).toBe(608);
        expect(initial.scrollY).toBe(384);
        expect(initial.viewportWidth).toBe(1280);
        expect(initial.viewportHeight).toBe(768);

        const after = await page.evaluate(() => window.gameAPI.scrollCamera(200, 100));
        expect(after.scrollX).toBe(808);
        expect(after.scrollY).toBe(484);
    });

    test('camera respects world bounds', async ({ page }) => {
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.scrollCamera(9999, 9999));
        const state = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera bounds: max scrollX = 2560 - 1280 = 1280, max scrollY = 1536 - 768 = 768
        expect(state.scrollX).toBeLessThanOrEqual(1280);
        expect(state.scrollY).toBeLessThanOrEqual(768);
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
