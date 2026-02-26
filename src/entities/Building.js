import { TILE_SIZE } from '../config/gameConfig.js';
import HealthBar from '../ui/HealthBar.js';

let nextBuildingId = 1;

export default class Building {
    constructor(scene, gridSystem, gx, gy, gridW, gridH, textureKey, maxHp) {
        this.id = `building_${nextBuildingId++}`;
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.gx = gx;
        this.gy = gy;
        this.gridW = gridW;
        this.gridH = gridH;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.alive = true;
        this.type = 'building';

        // Calculate pixel position (center of the occupied area)
        const px = gx * TILE_SIZE + (gridW * TILE_SIZE) / 2;
        const py = gy * TILE_SIZE + (gridH * TILE_SIZE) / 2;

        this.sprite = scene.add.image(px, py, textureKey);
        this.sprite.setDepth(py);

        // Register occupancy
        gridSystem.occupy(gx, gy, gridW, gridH, this.id);

        // Health bar (positioned above the building)
        this.healthBar = new HealthBar(scene, this, -(gridH * TILE_SIZE) / 2 - 8, 50);
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.healthBar) this.healthBar.update();

        // Smoke puff on hit
        if (this.hp > 0) this.spawnSmoke();

        if (this.hp <= 0) {
            this.alive = false;
            this.onDestroyed();
        }
    }

    spawnSmoke() {
        const center = this.getCenter();
        for (let i = 0; i < 3; i++) {
            const x = center.x + (Math.random() - 0.5) * this.gridW * TILE_SIZE * 0.6;
            const y = center.y - this.gridH * TILE_SIZE * 0.3 + (Math.random() - 0.5) * 10;
            const smoke = this.scene.add.circle(x, y, 6, 0x666666, 0.4);
            smoke.setDepth(9998);
            this.scene.tweens.add({
                targets: smoke,
                y: y - 25,
                scaleX: 2.5,
                scaleY: 2.5,
                alpha: 0,
                duration: 600 + Math.random() * 300,
                onComplete: () => smoke.destroy()
            });
        }
    }

    onDestroyed() {
        if (this.healthBar) { this.healthBar.destroy(); this.healthBar = null; }
        this.gridSystem.free(this.gx, this.gy, this.gridW, this.gridH);
        this.sprite.destroy();
    }

    getCenter() {
        return {
            x: this.gx * TILE_SIZE + (this.gridW * TILE_SIZE) / 2,
            y: this.gy * TILE_SIZE + (this.gridH * TILE_SIZE) / 2
        };
    }
}
