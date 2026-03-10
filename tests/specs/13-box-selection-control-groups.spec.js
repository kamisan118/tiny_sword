import { test, expect } from '@playwright/test';
import { waitForGameReady, getGameState, collectPageErrors } from '../helpers/gameHelper.js';

async function buildBarracksAndProduceWarriors(page, count = 3) {
    await page.evaluate(() => window.gameAPI.setGold(5000));
    const pos = await page.evaluate(() => window.gameAPI.findBuildablePosition(3, 3));
    const result = await page.evaluate(([gx, gy]) => window.gameAPI.buildStructure('barracks', gx, gy), [pos.gx, pos.gy]);

    // Produce multiple warriors
    for (let i = 0; i < count; i++) {
        await page.evaluate((bid) => window.gameAPI.produceUnit(bid, 'warrior'), result.buildingId);

        // Force complete production
        await page.evaluate((bid) => {
            const scene = window.game.scene.getScene('GameScene');
            const barracks = scene.buildings.find(b => b.id === bid);
            if (barracks) barracks.produceTimer = 999999;
        }, result.buildingId);
        await page.waitForTimeout(300);
    }

    // Wait for all units to be produced
    await page.waitForTimeout(500);
}

test.describe('Box Selection', () => {
    test('box select multiple units via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 3);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');
        expect(warriors.length).toBeGreaterThanOrEqual(3);

        // Get bounds of all warriors
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const w of warriors) {
            minX = Math.min(minX, w.x);
            minY = Math.min(minY, w.y);
            maxX = Math.max(maxX, w.x);
            maxY = Math.max(maxY, w.y);
        }

        // Expand box slightly to ensure all units are included
        const count = await page.evaluate(
            ([x1, y1, x2, y2]) => window.gameAPI.boxSelectUnits(x1, y1, x2, y2),
            [minX - 50, minY - 50, maxX + 50, maxY + 50]
        );

        expect(count).toBeGreaterThanOrEqual(3);

        // Verify selection
        const selectedIds = await page.evaluate(() => window.gameAPI.getSelectedUnits());
        expect(selectedIds.length).toBe(count);

        expect(errors).toHaveLength(0);
    });

    test('box select moves all selected units together', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 3);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');

        // Box select all warriors
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const w of warriors) {
            minX = Math.min(minX, w.x);
            minY = Math.min(minY, w.y);
            maxX = Math.max(maxX, w.x);
            maxY = Math.max(maxY, w.y);
        }

        await page.evaluate(
            ([x1, y1, x2, y2]) => window.gameAPI.boxSelectUnits(x1, y1, x2, y2),
            [minX - 50, minY - 50, maxX + 50, maxY + 50]
        );

        // Command all units to move
        const castle = await page.evaluate(() => window.gameAPI.getCastlePosition());
        const targetGx = castle.gx + 5;
        const targetGy = castle.gy + 5;

        await page.evaluate(([gx, gy]) => {
            const scene = window.game.scene.getScene('GameScene');
            const pos = scene.gridSystem.gridToPixel(gx, gy);
            scene.commandSystem.issueMove(scene.selectionSystem.selectedUnits, pos.x, pos.y);
        }, [targetGx, targetGy]);

        // Wait for units to start moving
        await page.waitForTimeout(500);

        // Check that all selected units are in MOVING state
        const movingCount = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.playerUnits.filter(u => u.state === 'moving').length;
        });

        expect(movingCount).toBeGreaterThanOrEqual(3);
        expect(errors).toHaveLength(0);
    });
});

test.describe('Control Groups', () => {
    test('create and select control group via API', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 3);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');
        const warriorIds = warriors.map(w => w.id);

        // Create control group 1
        const created = await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [1, warriorIds]
        );
        expect(created).toBe(true);

        // Verify control group was created
        const groupIds = await page.evaluate((n) => window.gameAPI.getControlGroup(n), 1);
        expect(groupIds.length).toBe(warriorIds.length);

        // Deselect all
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.selectionSystem.deselectAll();
        });

        // Select control group 1
        const selectedCount = await page.evaluate((n) => window.gameAPI.selectControlGroup(n), 1);
        expect(selectedCount).toBe(warriorIds.length);

        expect(errors).toHaveLength(0);
    });

    test('control group persists after unit death', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 3);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');
        const warriorIds = warriors.map(w => w.id);

        // Create control group 1
        await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [1, warriorIds]
        );

        // Kill one warrior
        await page.evaluate((id) => {
            const scene = window.game.scene.getScene('GameScene');
            const unit = scene.playerUnits.find(u => u.id === id);
            if (unit) unit.takeDamage(9999);
        }, warriorIds[0]);

        await page.waitForTimeout(500);

        // Select control group 1 - should only select alive units
        const selectedCount = await page.evaluate((n) => window.gameAPI.selectControlGroup(n), 1);
        expect(selectedCount).toBe(warriorIds.length - 1);

        // Verify control group was cleaned up
        const groupIds = await page.evaluate((n) => window.gameAPI.getControlGroup(n), 1);
        expect(groupIds.length).toBe(warriorIds.length - 1);

        expect(errors).toHaveLength(0);
    });

    test('multiple control groups work independently', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 4);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');

        // Create two control groups
        const group1Ids = warriors.slice(0, 2).map(w => w.id);
        const group2Ids = warriors.slice(2, 4).map(w => w.id);

        await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [1, group1Ids]
        );
        await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [2, group2Ids]
        );

        // Select group 1
        let count = await page.evaluate((n) => window.gameAPI.selectControlGroup(n), 1);
        expect(count).toBe(2);

        let selected = await page.evaluate(() => window.gameAPI.getSelectedUnits());
        expect(selected).toEqual(expect.arrayContaining(group1Ids));

        // Select group 2
        count = await page.evaluate((n) => window.gameAPI.selectControlGroup(n), 2);
        expect(count).toBe(2);

        selected = await page.evaluate(() => window.gameAPI.getSelectedUnits());
        expect(selected).toEqual(expect.arrayContaining(group2Ids));

        expect(errors).toHaveLength(0);
    });

    test('empty control group can be reassigned', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        await buildBarracksAndProduceWarriors(page, 2);

        const state = await getGameState(page);
        const warriors = state.playerUnits.filter(u => u.type === 'warrior');
        const warrior1Id = warriors[0].id;
        const warrior2Id = warriors[1].id;

        // Create control group 1 with first warrior
        await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [1, [warrior1Id]]
        );

        // Verify
        let groupIds = await page.evaluate((n) => window.gameAPI.getControlGroup(n), 1);
        expect(groupIds).toEqual([warrior1Id]);

        // Reassign control group 1 with second warrior
        await page.evaluate(
            ([groupNum, ids]) => window.gameAPI.createControlGroup(groupNum, ids),
            [1, [warrior2Id]]
        );

        // Verify reassignment
        groupIds = await page.evaluate((n) => window.gameAPI.getControlGroup(n), 1);
        expect(groupIds).toEqual([warrior2Id]);

        expect(errors).toHaveLength(0);
    });
});
