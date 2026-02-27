import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

async function buildBarracksAndProduceWarrior(page) {
    await page.evaluate(() => window.gameAPI.setGold(500));
    const result = await page.evaluate(() => window.gameAPI.buildStructure('barracks', 8, 4));
    await page.evaluate((bid) => window.gameAPI.produceUnit(bid, 'warrior'), result.buildingId);

    // Force complete production
    await page.evaluate((bid) => {
        const scene = window.game.scene.getScene('GameScene');
        const barracks = scene.buildings.find(b => b.id === bid);
        if (barracks) barracks.produceTimer = 999999;
    }, result.buildingId);
    await page.waitForTimeout(500);
}

test.describe('Unit Selection & Movement', () => {
    test('select a warrior via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarrior(page);

        const state = await getGameState(page);
        const warrior = state.playerUnits.find(u => u.type === 'warrior');
        expect(warrior).toBeTruthy();

        const ok = await page.evaluate(id => window.gameAPI.selectUnit(id), warrior.id);
        expect(ok).toBe(true);
        expect(errors).toHaveLength(0);
    });

    test('move a warrior to a grid position', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarrior(page);

        const state = await getGameState(page);
        const warrior = state.playerUnits.find(u => u.type === 'warrior');
        expect(warrior).toBeTruthy();

        const startX = warrior.x;
        const startY = warrior.y;

        const ok = await page.evaluate(id => window.gameAPI.commandMove(id, 6, 6), warrior.id);
        expect(ok).toBe(true);

        // Poll until warrior has moved
        await page.waitForFunction(([id, sx, sy]) => {
            const s = window.gameAPI.getGameState();
            const w = s.playerUnits.find(u => u.id === id);
            return w && (Math.abs(w.x - sx) > 10 || Math.abs(w.y - sy) > 10);
        }, [warrior.id, startX, startY], { timeout: 5000 });

        expect(errors).toHaveLength(0);
    });
});
