import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Unit Selection & Movement', () => {
    test('select a pawn via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        const state = await getGameState(page);

        const pawnId = state.playerUnits[0].id;
        const ok = await page.evaluate(id => window.gameAPI.selectUnit(id), pawnId);
        expect(ok).toBe(true);
        expect(errors).toHaveLength(0);
    });

    test('move a pawn to a grid position', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);
        const state = await getGameState(page);

        const pawnId = state.playerUnits[0].id;
        const startX = state.playerUnits[0].x;
        const startY = state.playerUnits[0].y;

        const ok = await page.evaluate(id => window.gameAPI.commandMove(id, 8, 6), pawnId);
        expect(ok).toBe(true);

        // Poll until pawn has moved
        await page.waitForFunction(([id, sx, sy]) => {
            const s = window.gameAPI.getGameState();
            const p = s.playerUnits.find(u => u.id === id);
            return p && (Math.abs(p.x - sx) > 10 || Math.abs(p.y - sy) > 10);
        }, [pawnId, startX, startY], { timeout: 5000 });

        expect(errors).toHaveLength(0);
    });
});
