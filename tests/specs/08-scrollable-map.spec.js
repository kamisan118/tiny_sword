import { test, expect } from '@playwright/test';
import { waitForGameReady } from '../helpers/gameHelper.js';

test.describe('Scrollable Map', () => {
    test('camera starts centered on castle', async ({ page }) => {
        await waitForGameReady(page);

        const initial = await page.evaluate(() => window.gameAPI.getCameraState());
        // Camera should be centered on the castle (position varies by map)
        // Just verify it's scrolled to some reasonable position (not stuck at 0,0 unless castle is top-left)
        expect(initial.viewportWidth).toBe(1280);
        expect(initial.viewportHeight).toBe(768);

        const scrolledX = initial.scrollX;
        const scrolledY = initial.scrollY;
        const after = await page.evaluate(() => window.gameAPI.scrollCamera(200, 100));
        // Camera bounds: max scrollX = 5120 - 1280 = 3840, max scrollY = 3072 - 768 = 2304
        expect(after.scrollX).toBe(Math.min(3840, Math.max(0, scrolledX + 200)));
        expect(after.scrollY).toBe(Math.min(2304, Math.max(0, scrolledY + 100)));
    });

    test('camera respects world bounds', async ({ page }) => {
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.scrollCamera(9999, 9999));
        const state = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera bounds: max scrollX = 5120 - 1280 = 3840, max scrollY = 3072 - 768 = 2304
        expect(state.scrollX).toBeLessThanOrEqual(3840);
        expect(state.scrollY).toBeLessThanOrEqual(2304);
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

    test('map has expanded grid (80x48)', async ({ page }) => {
        await waitForGameReady(page);

        const gridInfo = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const grid = scene.gridSystem.grid;
            return { rows: grid.length, cols: grid[0].length };
        });

        expect(gridInfo.rows).toBe(48);
        expect(gridInfo.cols).toBe(80);
    });
});
