import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

test.describe('Game Loading', () => {
    test('game boots and reaches GameScene without errors', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        // gameAPI should exist
        const hasAPI = await page.evaluate(() => typeof window.gameAPI !== 'undefined');
        expect(hasAPI).toBe(true);

        // No page errors
        expect(errors).toHaveLength(0);
    });

    test('initial state is correct', async ({ page }) => {
        await waitForGameReady(page);
        const state = await getGameState(page);

        // Gold
        expect(state.gold).toBe(100);

        // 2 starting pawns
        expect(state.playerUnits).toHaveLength(2);
        expect(state.playerUnits.every(u => u.type === 'pawn')).toBe(true);

        // No enemies yet
        expect(state.enemyUnits).toHaveLength(0);

        // 4 buildings: 1 castle + 3 gold mines
        expect(state.buildings).toHaveLength(4);
        expect(state.buildings.filter(b => b.type === 'castle')).toHaveLength(1);
        expect(state.buildings.filter(b => b.type === 'goldmine')).toHaveLength(3);

        // Wave 0, not started
        expect(state.wave.current).toBe(0);
        expect(state.wave.allSpawned).toBe(false);

        // Game not over
        expect(state.gameOver).toBe(false);
        expect(state.gameResult).toBeNull();
    });
});
