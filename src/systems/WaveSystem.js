import { WAVE_INTERVAL, MAX_WAVES, GRID_ROWS, ENEMY_SPAWN_MIN_X } from '../config/gameConfig.js';
import GoblinTorch from '../entities/GoblinTorch.js';
import GoblinBarrel from '../entities/GoblinBarrel.js';
import GoblinTNT from '../entities/GoblinTNT.js';

// Wave definitions: each wave is an array of { type, count }
const WAVE_DEFS = [
    [{ type: 'torch', count: 3 }],                                          // Wave 1
    [{ type: 'torch', count: 5 }],                                          // Wave 2
    [{ type: 'torch', count: 4 }, { type: 'barrel', count: 2 }],            // Wave 3
    [{ type: 'torch', count: 5 }, { type: 'barrel', count: 3 }],            // Wave 4
    [{ type: 'torch', count: 4 }, { type: 'barrel', count: 2 }, { type: 'tnt', count: 1 }], // Wave 5
    [{ type: 'torch', count: 6 }, { type: 'barrel', count: 3 }, { type: 'tnt', count: 2 }], // Wave 6
    [{ type: 'torch', count: 8 }, { type: 'barrel', count: 4 }],            // Wave 7
    [{ type: 'torch', count: 6 }, { type: 'barrel', count: 4 }, { type: 'tnt', count: 3 }], // Wave 8
    [{ type: 'torch', count: 10 }, { type: 'barrel', count: 5 }, { type: 'tnt', count: 2 }], // Wave 9
    [{ type: 'torch', count: 12 }, { type: 'barrel', count: 6 }, { type: 'tnt', count: 4 }], // Wave 10
];

export default class WaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.maxWaves = MAX_WAVES;
        this.waveInterval = WAVE_INTERVAL;
        this.timer = 0;
        this.allWavesSpawned = false;
        this.gameOver = false;
    }

    update(time, delta) {
        if (this.gameOver || this.allWavesSpawned) return;

        this.timer += delta;

        // Update HUD timer
        const remaining = (this.waveInterval - this.timer) / 1000;
        this.scene.hud.updateTimer(remaining);

        if (this.timer >= this.waveInterval) {
            this.timer = 0;
            this.spawnWave();
        }
    }

    spawnWave() {
        if (this.currentWave >= this.maxWaves) {
            this.allWavesSpawned = true;
            return;
        }

        this.currentWave++;
        this.scene.eventBus.emit('waveChanged', this.currentWave);

        const waveDef = WAVE_DEFS[this.currentWave - 1] || WAVE_DEFS[WAVE_DEFS.length - 1];

        let spawnIndex = 0;
        for (const group of waveDef) {
            for (let i = 0; i < group.count; i++) {
                // Spread spawns across right edge
                const gx = ENEMY_SPAWN_MIN_X + (spawnIndex % 2);
                const gy = 2 + (spawnIndex % (GRID_ROWS - 4));

                const enemy = this.createEnemy(group.type, gx, gy);
                if (enemy) {
                    this.scene.enemyUnits.push(enemy);
                }
                spawnIndex++;
            }
        }
    }

    createEnemy(type, gx, gy) {
        switch (type) {
            case 'torch':
                return new GoblinTorch(this.scene, this.scene.gridSystem, gx, gy);
            case 'barrel':
                return new GoblinBarrel(this.scene, this.scene.gridSystem, gx, gy);
            case 'tnt':
                return new GoblinTNT(this.scene, this.scene.gridSystem, gx, gy);
            default:
                return null;
        }
    }

    // For testing: skip to specific wave
    skipToWave(n) {
        this.currentWave = n - 1;
        this.timer = this.waveInterval - 100; // about to trigger
    }

    // Check if all waves complete and all enemies dead
    isVictory() {
        if (!this.allWavesSpawned) return false;
        return this.scene.enemyUnits.every(e => !e.alive);
    }
}
