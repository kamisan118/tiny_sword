import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Resource Harvesting', () => {
    test('pawn harvests gold and increases gold count', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        const state = await getGameState(page);

        const pawnId = state.playerUnits[0].id;
        const mineId = state.buildings.find(b => b.type === 'goldmine').id;

        // Command pawn to harvest
        const ok = await page.evaluate(
            ([uid, mid]) => window.gameAPI.commandHarvest(uid, mid),
            [pawnId, mineId]
        );
        expect(ok).toBe(true);

        // Poll until gold increases (move + 3s harvest + return + deposit)
        await page.waitForFunction(() => {
            const s = window.gameAPI.getGameState();
            return s.gold > 100;
        }, { timeout: 15000 });

        expect(errors).toHaveLength(0);
    });
});
