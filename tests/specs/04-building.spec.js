import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Building System', () => {
    test('build a barracks via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.setGold(500));

        const result = await page.evaluate(() => window.gameAPI.buildStructure('barracks', 8, 4));
        expect(result.success).toBe(true);
        expect(result.buildingId).toBeTruthy();

        const state = await getGameState(page);
        expect(state.buildings).toHaveLength(2); // 1 castle + 1 barracks
        expect(state.buildings.filter(b => b.type === 'barracks')).toHaveLength(1);
        expect(state.gold).toBe(350); // 500 - 150
        expect(errors).toHaveLength(0);
    });

    test('build a gold mine via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await page.evaluate(() => window.gameAPI.setGold(500));

        const result = await page.evaluate(() => window.gameAPI.buildStructure('goldmine', 7, 5));
        expect(result.success).toBe(true);
        expect(result.buildingId).toBeTruthy();

        const state = await getGameState(page);
        expect(state.buildings).toHaveLength(2); // 1 castle + 1 goldmine
        expect(state.buildings.filter(b => b.type === 'goldmine')).toHaveLength(1);
        expect(state.gold).toBe(400); // 500 - 100
        expect(errors).toHaveLength(0);
    });

    test('cannot build with insufficient gold', async ({ page }) => {
        await waitForGameReady(page);

        // Starting gold is 100, barracks costs 150
        const result = await page.evaluate(() => window.gameAPI.buildStructure('barracks', 8, 4));
        expect(result.success).toBe(false);
        expect(result.reason).toBe('insufficient_gold');
    });

    test('cannot build on occupied space', async ({ page }) => {
        await waitForGameReady(page);
        await page.evaluate(() => window.gameAPI.setGold(500));

        // Castle is at (1,4) — try to build overlapping
        const result = await page.evaluate(() => window.gameAPI.buildStructure('barracks', 1, 4));
        expect(result.success).toBe(false);
        expect(result.reason).toBe('invalid_placement');
    });
});
