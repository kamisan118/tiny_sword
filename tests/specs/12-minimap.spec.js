import { test, expect } from '@playwright/test';
import { waitForGameReady, collectPageErrors } from '../helpers/gameHelper.js';

const MINIMAP_BLUE = { r: 68, g: 68, b: 255, a: 255 };
const MINIMAP_RED = { r: 255, g: 68, b: 68, a: 255 };

async function buildBarracksAndProduceWarrior(page) {
    return page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        const api = window.gameAPI;
        const pos = api.findBuildablePosition(3, 3);

        if (!pos) {
            return { buildingId: null, warriorId: null, reason: 'no_buildable_position' };
        }

        api.setGold(1000);
        const buildResult = api.buildStructure('barracks', pos.gx, pos.gy);
        if (!buildResult.success) {
            return { buildingId: null, warriorId: null, reason: buildResult.reason };
        }

        const produceResult = api.produceUnit(buildResult.buildingId, 'warrior');
        if (!produceResult.success) {
            return { buildingId: buildResult.buildingId, warriorId: null, reason: produceResult.reason };
        }

        const barracks = scene.buildings.find(b => b.id === buildResult.buildingId);
        if (barracks && barracks.producing) {
            barracks.produceTimer = Number.MAX_SAFE_INTEGER;
            barracks.update(scene.time.now, 16);
        }

        const warrior = scene.playerUnits[scene.playerUnits.length - 1] || null;
        return {
            buildingId: buildResult.buildingId,
            warriorId: warrior ? warrior.id : null,
            reason: warrior ? null : 'warrior_not_spawned'
        };
    });
}

async function readMinimapMarkerColor(page, { collection, id, now }) {
    return page.evaluate(async ({ collection, id, now }) => {
        const scene = window.game.scene.getScene('GameScene');
        const minimap = scene.minimap;
        const entries = {
            playerUnits: scene.playerUnits,
            enemyUnits: scene.enemyUnits,
            buildings: scene.buildings
        };

        const entity = entries[collection]?.find(entry => entry.id === id);
        if (!entity || !entity.alive) {
            return null;
        }

        if (typeof now === 'number') {
            scene.time.now = now;
        }

        const world = collection === 'buildings'
            ? entity.getCenter()
            : { x: entity.sprite.x, y: entity.sprite.y };

        minimap.render();

        const pixelX = Math.round(world.x * minimap.scaleX);
        const pixelY = Math.round(world.y * minimap.scaleY);
        const pixel = await new Promise(resolve => {
            minimap.renderTexture.snapshotPixel(pixelX, pixelY, resolve);
        });

        return {
            color: { r: pixel.r, g: pixel.g, b: pixel.b, a: pixel.a },
            pixelX,
            pixelY,
            worldX: world.x,
            worldY: world.y,
            minimapUnderAttackUntil: entity.minimapUnderAttackUntil ?? null,
            state: entity.state ?? null
        };
    }, { collection, id, now });
}

async function findVisibleMinimapMarker(page, { collection, ids, now, expectedColor, radius = 2 }) {
    return page.evaluate(async ({ collection, ids, now, expectedColor, radius }) => {
        const scene = window.game.scene.getScene('GameScene');
        const minimap = scene.minimap;
        const entries = {
            playerUnits: scene.playerUnits,
            enemyUnits: scene.enemyUnits,
            buildings: scene.buildings,
            liveHostileUnits: scene.children.list
                .map(child => child?.unitRef)
                .filter(unit => unit && unit.alive && unit.faction === 'enemy')
        };
        const matchesExpectedColor = pixel => (
            pixel &&
            pixel.r === expectedColor.r &&
            pixel.g === expectedColor.g &&
            pixel.b === expectedColor.b &&
            pixel.a === expectedColor.a
        );

        if (typeof now === 'number') {
            scene.time.now = now;
        }

        minimap.render();

        for (const id of ids) {
            const entity = entries[collection]?.find(entry => entry.id === id && entry.alive);
            if (!entity) continue;

            const world = collection === 'buildings'
                ? entity.getCenter()
                : entity.sprite ? { x: entity.sprite.x, y: entity.sprite.y } : null;
            if (!world) continue;

            const pixelX = Math.round(world.x * minimap.scaleX);
            const pixelY = Math.round(world.y * minimap.scaleY);

            for (let offsetY = -radius; offsetY <= radius; offsetY++) {
                for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                    const pixel = await new Promise(resolve => {
                        minimap.renderTexture.snapshotPixel(pixelX + offsetX, pixelY + offsetY, resolve);
                    });

                    if (matchesExpectedColor(pixel)) {
                        return {
                            id,
                            pixelX,
                            pixelY,
                            offsetX,
                            offsetY,
                            color: { r: pixel.r, g: pixel.g, b: pixel.b, a: pixel.a }
                        };
                    }
                }
            }
        }

        return null;
    }, { collection, ids, now, expectedColor, radius });
}

function expectMarkerColor(sample, expectedColor) {
    expect(sample).not.toBeNull();
    expect(sample.color).toMatchObject(expectedColor);
}

test.describe('Minimap System', () => {
    test('minimap is visible on game start', async ({ page }) => {
        await waitForGameReady(page);

        const minimapExists = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.minimap && scene.minimap.visible;
        });

        expect(minimapExists).toBe(true);
    });

    test('minimap shows terrain colors', async ({ page }) => {
        await waitForGameReady(page);

        const terrainRendered = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const minimap = scene.minimap;
            // Check that renderTexture exists and has content
            return minimap.renderTexture !== null;
        });

        expect(terrainRendered).toBe(true);
    });

    test('minimap renders player buildings and units at their real world positions', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        const setup = await buildBarracksAndProduceWarrior(page);
        expect(setup.reason).toBeNull();

        const buildingMarker = await readMinimapMarkerColor(page, {
            collection: 'buildings',
            id: setup.buildingId,
            now: 0
        });
        const warriorMarker = await readMinimapMarkerColor(page, {
            collection: 'playerUnits',
            id: setup.warriorId,
            now: 0
        });

        expectMarkerColor(buildingMarker, MINIMAP_BLUE);
        expectMarkerColor(warriorMarker, MINIMAP_BLUE);
        expect(errors).toHaveLength(0);
    });

    test('M key toggles minimap visibility', async ({ page }) => {
        await waitForGameReady(page);

        // Initially visible
        let visible = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.minimap.visible;
        });
        expect(visible).toBe(true);

        // Press M to hide
        await page.keyboard.press('M');
        await page.waitForTimeout(100);

        visible = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.minimap.visible;
        });
        expect(visible).toBe(false);

        // Press M again to show
        await page.keyboard.press('M');
        await page.waitForTimeout(100);

        visible = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.minimap.visible;
        });
        expect(visible).toBe(true);
    });

    test('clicking minimap moves camera', async ({ page }) => {
        await waitForGameReady(page);

        const initialCamera = await page.evaluate(() => window.gameAPI.getCameraState());

        // Simulate minimap click programmatically
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const minimap = scene.minimap;

            // Simulate clicking on a different part of the minimap
            // Click at minimap local coordinates (100, 60) which is center of minimap
            const fakePointer = {
                x: minimap.x + 100,
                y: minimap.y + 60
            };

            minimap.onMinimapClick(fakePointer);
        });

        await page.waitForTimeout(100);

        const newCamera = await page.evaluate(() => window.gameAPI.getCameraState());

        // Camera should have moved to a different position
        const cameraMoved = newCamera.scrollX !== initialCamera.scrollX ||
                          newCamera.scrollY !== initialCamera.scrollY;

        expect(cameraMoved).toBe(true);
    });

    test('minimap viewport frame updates when camera moves', async ({ page }) => {
        await waitForGameReady(page);

        // Move camera using arrow keys
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(300);
        await page.keyboard.up('ArrowRight');

        // Verify camera moved
        const cameraMoved = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const scrollX = scene.cameras.main.scrollX;
            return scrollX > 0;
        });

        expect(cameraMoved).toBe(true);

        // Minimap should still be rendering (viewport frame should update)
        const minimapUpdating = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.minimap.visible;
        });

        expect(minimapUpdating).toBe(true);
    });

    test('minimap renders a spawned enemy wave as visible red live hostile markers', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        const waveSpawnResult = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.waveSystem.spawnWave();

            const enemyIds = scene.children.list
                .map(child => child?.unitRef)
                .filter(unit => unit && unit.alive && unit.faction === 'enemy')
                .map(unit => unit.id);

            return {
                currentWave: scene.waveSystem.currentWave,
                enemyIds
            };
        });

        expect(waveSpawnResult.currentWave).toBe(1);
        expect(waveSpawnResult.enemyIds.length).toBeGreaterThan(0);

        const visibleWaveMarker = await findVisibleMinimapMarker(page, {
            collection: 'liveHostileUnits',
            ids: waveSpawnResult.enemyIds,
            expectedColor: MINIMAP_RED,
            radius: 2
        });

        expect(
            visibleWaveMarker,
            'Expected at least one actual wave-spawned enemy to render a visible red minimap marker'
        ).not.toBeNull();
        expect(errors).toHaveLength(0);
    });

    test('player markers stay blue while attacking and flash red only while under enemy attack', async ({ page }) => {
        const errors = collectPageErrors(page);
        await waitForGameReady(page);

        const setup = await buildBarracksAndProduceWarrior(page);
        expect(setup.reason).toBeNull();

        const attackerSetup = await page.evaluate(({ warriorId }) => {
            const scene = window.game.scene.getScene('GameScene');
            const api = window.gameAPI;
            const castle = api.getCastlePosition();
            const result = api.spawnTestEnemy('torch', castle.gx + 8, castle.gy);
            if (!result.success) {
                return null;
            }

            const warrior = scene.playerUnits.find(unit => unit.id === warriorId);
            const enemy = scene.enemyUnits.find(unit => unit.id === result.unitId);
            if (!warrior || !enemy) {
                return null;
            }

            warrior.attackTarget = enemy;
            warrior.state = 'attacking';
            warrior.minimapUnderAttackUntil = 0;

            return { enemyId: enemy.id };
        }, { warriorId: setup.warriorId });

        expect(attackerSetup).not.toBeNull();

        const attackingMarker = await readMinimapMarkerColor(page, {
            collection: 'playerUnits',
            id: setup.warriorId,
            now: 1500
        });

        const combatState = await page.evaluate(({ warriorId, buildingId, enemyId }) => {
            const scene = window.game.scene.getScene('GameScene');
            const warrior = scene.playerUnits.find(unit => unit.id === warriorId);
            const barracks = scene.buildings.find(building => building.id === buildingId);
            const enemy = scene.enemyUnits.find(unit => unit.id === enemyId);
            if (!warrior || !barracks || !enemy) {
                return null;
            }

            enemy.attackCooldown = 1000;

            scene.time.now = 2000;
            warrior.takeDamage(1, enemy);
            barracks.takeDamage(1, enemy);

            return {
                enemyId: enemy.id,
                activeFlashTime: 2500,
                expiredTime: 3501,
                warriorUnderAttackUntil: warrior.minimapUnderAttackUntil,
                buildingUnderAttackUntil: barracks.minimapUnderAttackUntil
            };
        }, { ...setup, enemyId: attackerSetup.enemyId });

        expect(combatState).not.toBeNull();
        expect(combatState.warriorUnderAttackUntil).toBeGreaterThan(combatState.activeFlashTime);
        expect(combatState.buildingUnderAttackUntil).toBeGreaterThan(combatState.activeFlashTime);

        const warriorUnderAttackMarker = await readMinimapMarkerColor(page, {
            collection: 'playerUnits',
            id: setup.warriorId,
            now: combatState.activeFlashTime
        });
        const buildingUnderAttackMarker = await readMinimapMarkerColor(page, {
            collection: 'buildings',
            id: setup.buildingId,
            now: combatState.activeFlashTime
        });
        const warriorRecoveredMarker = await readMinimapMarkerColor(page, {
            collection: 'playerUnits',
            id: setup.warriorId,
            now: combatState.expiredTime
        });
        const buildingRecoveredMarker = await readMinimapMarkerColor(page, {
            collection: 'buildings',
            id: setup.buildingId,
            now: combatState.expiredTime
        });

        expectMarkerColor(attackingMarker, MINIMAP_BLUE);
        expectMarkerColor(warriorUnderAttackMarker, MINIMAP_RED);
        expectMarkerColor(buildingUnderAttackMarker, MINIMAP_RED);
        expectMarkerColor(warriorRecoveredMarker, MINIMAP_BLUE);
        expectMarkerColor(buildingRecoveredMarker, MINIMAP_BLUE);
        expect(errors).toHaveLength(0);
    });
});
