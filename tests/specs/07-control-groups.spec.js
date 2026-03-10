import { test, expect } from '@playwright/test';

test.describe('Control Group System', () => {
    test('create control group with Ctrl+1 and select with 1', async ({ page }) => {
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(1000);

        // Spawn two warriors
        const api = page.evaluate(() => window.gameAPI);
        await page.evaluate(() => {
            window.gameAPI.spawnWarrior();
            window.gameAPI.spawnWarrior();
        });
        await page.waitForTimeout(500);

        // Get unit IDs
        const unitIds = await page.evaluate(() => {
            return window.gameAPI.getAllPlayerUnits().slice(0, 2).map(u => u.id);
        });
        expect(unitIds.length).toBe(2);

        // Select both units
        await page.evaluate((ids) => {
            window.gameAPI.selectUnit(ids[0]);
            window.gameAPI.selectUnit(ids[1]);
        }, unitIds);

        // Verify selection
        let selectedCount = await page.evaluate(() => {
            return window.gameAPI.getSelectedUnits().length;
        });
        expect(selectedCount).toBe(2);

        // Create control group 1 with Ctrl+1
        await page.keyboard.down('Control');
        await page.keyboard.press('Digit1');
        await page.keyboard.up('Control');
        await page.waitForTimeout(100);

        // Deselect all
        await page.evaluate(() => {
            window.gameAPI.deselectAll();
        });

        selectedCount = await page.evaluate(() => {
            return window.gameAPI.getSelectedUnits().length;
        });
        expect(selectedCount).toBe(0);

        // Select control group 1 by pressing 1
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(100);

        // Verify both units are selected
        selectedCount = await page.evaluate(() => {
            return window.gameAPI.getSelectedUnits().length;
        });
        expect(selectedCount).toBe(2);

        console.log('✓ Control group creation and selection works');
    });

    test('control groups show visual indicators', async ({ page }) => {
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(1000);

        // Spawn a warrior
        await page.evaluate(() => {
            window.gameAPI.spawnWarrior();
        });
        await page.waitForTimeout(500);

        // Get unit ID
        const unitId = await page.evaluate(() => {
            return window.gameAPI.getAllPlayerUnits()[0].id;
        });

        // Select and create control group 3
        await page.evaluate((id) => {
            window.gameAPI.selectUnit(id);
        }, unitId);

        await page.keyboard.down('Control');
        await page.keyboard.press('Digit3');
        await page.keyboard.up('Control');
        await page.waitForTimeout(100);

        // Check if visual indicator exists (text "3" should be visible)
        const hasIndicator = await page.evaluate(() => {
            const scene = window.gameAPI.scene;
            const indicators = scene.controlGroupSystem.groupIndicators;
            return indicators.size > 0;
        });

        expect(hasIndicator).toBe(true);
        console.log('✓ Visual indicators are displayed');
    });

    test('multiple control groups can be created', async ({ page }) => {
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(1000);

        // Spawn 4 warriors
        await page.evaluate(() => {
            window.gameAPI.spawnWarrior();
            window.gameAPI.spawnWarrior();
            window.gameAPI.spawnWarrior();
            window.gameAPI.spawnWarrior();
        });
        await page.waitForTimeout(500);

        const unitIds = await page.evaluate(() => {
            return window.gameAPI.getAllPlayerUnits().map(u => u.id);
        });

        // Create group 1 with first 2 units
        await page.evaluate((ids) => {
            window.gameAPI.selectUnit(ids[0]);
            window.gameAPI.selectUnit(ids[1]);
        }, unitIds);

        await page.keyboard.down('Control');
        await page.keyboard.press('Digit1');
        await page.keyboard.up('Control');
        await page.waitForTimeout(100);

        // Create group 2 with last 2 units
        await page.evaluate((ids) => {
            window.gameAPI.deselectAll();
            window.gameAPI.selectUnit(ids[2]);
            window.gameAPI.selectUnit(ids[3]);
        }, unitIds);

        await page.keyboard.down('Control');
        await page.keyboard.press('Digit2');
        await page.keyboard.up('Control');
        await page.waitForTimeout(100);

        // Select group 1
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(100);

        let selectedCount = await page.evaluate(() => {
            return window.gameAPI.getSelectedUnits().length;
        });
        expect(selectedCount).toBe(2);

        // Select group 2
        await page.keyboard.press('Digit2');
        await page.waitForTimeout(100);

        selectedCount = await page.evaluate(() => {
            return window.gameAPI.getSelectedUnits().length;
        });
        expect(selectedCount).toBe(2);

        console.log('✓ Multiple control groups work independently');
    });

    test('double-tap jumps camera to control group', async ({ page }) => {
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(1000);

        // Spawn warrior
        await page.evaluate(() => {
            window.gameAPI.spawnWarrior();
        });
        await page.waitForTimeout(500);

        // Select and create group 1
        const unitId = await page.evaluate(() => {
            const unit = window.gameAPI.getAllPlayerUnits()[0];
            window.gameAPI.selectUnit(unit.id);
            return unit.id;
        });

        await page.keyboard.down('Control');
        await page.keyboard.press('Digit1');
        await page.keyboard.up('Control');
        await page.waitForTimeout(100);

        // Get camera position before
        const cameraBefore = await page.evaluate(() => {
            return {
                x: window.gameAPI.scene.cameras.main.scrollX,
                y: window.gameAPI.scene.cameras.main.scrollY
            };
        });

        // Move camera away
        await page.evaluate(() => {
            window.gameAPI.scene.cameras.main.scrollX += 500;
            window.gameAPI.scene.cameras.main.scrollY += 500;
        });

        // Double-tap 1 to jump to group
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(100);
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(600); // Wait for pan animation

        const cameraAfter = await page.evaluate(() => {
            return {
                x: window.gameAPI.scene.cameras.main.scrollX,
                y: window.gameAPI.scene.cameras.main.scrollY
            };
        });

        // Camera should have moved (panned towards the group)
        const cameraMoved = Math.abs(cameraAfter.x - (cameraBefore.x + 500)) > 10 ||
                           Math.abs(cameraAfter.y - (cameraBefore.y + 500)) > 10;

        expect(cameraMoved).toBe(true);
        console.log('✓ Double-tap camera jump works');
    });
});
