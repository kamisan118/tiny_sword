import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { PAWN_HP, PAWN_SPEED, PAWN_HARVEST_TIME, PAWN_HARVEST_AMOUNT, TILE_SIZE } from '../config/gameConfig.js';

export default class Pawn extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'pawn_idle', {
            hp: PAWN_HP,
            speed: PAWN_SPEED,
            faction: 'player',
            type: 'pawn',
            frameSize: 192
        });

        this.harvestTarget = null;
        this.harvestTimer = 0;
        this.carryingGold = false;
        this.returnTarget = null; // castle to return gold to

        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        createAnim(this.scene, 'pawn_idle_anim', 'pawn_idle', 0, 7, 8);
        createAnim(this.scene, 'pawn_run_anim', 'pawn_run', 0, 5, 10);
        createAnim(this.scene, 'pawn_interact_anim', 'pawn_interact', 0, 5, 8);
        createAnim(this.scene, 'pawn_idle_gold_anim', 'pawn_idle_gold', 0, 7, 8);
        createAnim(this.scene, 'pawn_run_gold_anim', 'pawn_run_gold', 0, 5, 10);
    }

    playAnim(name) {
        const map = {
            idle: this.carryingGold ? 'pawn_idle_gold_anim' : 'pawn_idle_anim',
            run: this.carryingGold ? 'pawn_run_gold_anim' : 'pawn_run_anim',
            harvest: 'pawn_interact_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        switch (this.state) {
            case UnitState.HARVESTING:
                this.updateHarvesting(time, delta);
                break;
            default:
                super.update(time, delta);
                break;
        }

        // Update depth + selection
        this.sprite.setDepth(this.sprite.y);
        this.selectionCircle.setPosition(this.sprite.x, this.sprite.y + 10);
        this.selectionCircle.setDepth(this.sprite.y - 1);
    }

    commandHarvest(mine, castle) {
        this.harvestTarget = mine;
        this.returnTarget = castle;
        this.goToMine();
    }

    goToMine() {
        if (!this.harvestTarget || this.harvestTarget.goldRemaining <= 0) {
            this.stopMoving();
            return;
        }
        const center = this.harvestTarget.getCenter();
        this.state = UnitState.MOVING;
        this.playAnim('run');
        this._harvestMoving = true;
        this.moveTo(center.x, center.y - TILE_SIZE); // stand above the mine
    }

    updateHarvesting(time, delta) {
        this.harvestTimer += delta;
        if (this.harvestTimer >= PAWN_HARVEST_TIME) {
            this.harvestTimer = 0;
            // Collect gold
            const amount = this.harvestTarget.harvest(PAWN_HARVEST_AMOUNT);
            if (amount > 0) {
                this.carryingGold = true;
                this.goldAmount = amount;
                this.goToCastle();
            } else {
                this.stopMoving();
            }
        }
    }

    goToCastle() {
        if (!this.returnTarget) {
            this.stopMoving();
            return;
        }
        const center = this.returnTarget.getCenter();
        this._returningToCastle = true;
        this.playAnim('run');
        this.moveTo(center.x, center.y + TILE_SIZE * 2); // stand below castle
    }

    depositGold() {
        this.carryingGold = false;

        if (this.scene.resourceSystem) {
            this.scene.resourceSystem.addGold(this.goldAmount || PAWN_HARVEST_AMOUNT);
        }
        this.spawnGoldSparkle();
        this.goldAmount = 0;

        // Go back to mine if it still has gold
        if (this.harvestTarget && this.harvestTarget.goldRemaining > 0) {
            this.goToMine();
        } else {
            this.playAnim('idle');
        }
    }

    spawnGoldSparkle() {
        if (!this.sprite || !this.scene) return;
        for (let i = 0; i < 5; i++) {
            const x = this.sprite.x + (Math.random() - 0.5) * 20;
            const y = this.sprite.y - 10 + (Math.random() - 0.5) * 10;
            const spark = this.scene.add.circle(x, y, 3, 0xffdd00, 0.9);
            spark.setDepth(9999);
            this.scene.tweens.add({
                targets: spark,
                y: y - 20 - Math.random() * 15,
                x: x + (Math.random() - 0.5) * 20,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 500 + Math.random() * 300,
                onComplete: () => spark.destroy()
            });
        }
    }

    // Override stopMoving to check harvest/return state
    stopMoving() {
        if (this._harvestMoving && this.harvestTarget) {
            this._harvestMoving = false;
            this.state = UnitState.HARVESTING;
            this.harvestTimer = 0;
            this.playAnim('harvest');
            return;
        }
        if (this._returningToCastle) {
            this._returningToCastle = false;
            this.depositGold();
            return;
        }
        this._harvestMoving = false;
        this._returningToCastle = false;
        super.stopMoving();
    }
}
