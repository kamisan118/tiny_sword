import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { TILE_SIZE } from '../config/gameConfig.js';

export default class GoblinTorch extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'goblin_torch', {
            hp: 60,
            speed: 60,
            attackDamage: 10,
            attackRange: 1.2,
            attackCooldown: 1000,
            faction: 'enemy',
            type: 'goblin_torch',
            frameSize: 192
        });

        this.hasDeathAnim = true;
        this.initAnims();
        this.playAnim('idle');
    }

    // Torch_Red.png: 7 cols × 5 rows (192×192 frames)
    // Row 0: idle (0-6), Row 1: run (7-13), Row 2: attack (14-20), Row 3: attack2 (21-27), Row 4: death (28-34)
    initAnims() {
        createAnim(this.scene, 'goblin_torch_idle', 'goblin_torch', 0, 6, 8);
        createAnim(this.scene, 'goblin_torch_run', 'goblin_torch', 7, 13, 10);
        createAnim(this.scene, 'goblin_torch_attack', 'goblin_torch', 14, 20, 10, 0);
        createAnim(this.scene, 'goblin_torch_death', 'goblin_torch', 28, 34, 8, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'goblin_torch_idle',
            run: 'goblin_torch_run',
            attack: 'goblin_torch_attack',
            death: 'goblin_torch_death'
        };
        const animKey = map[name];
        if (animKey && this.sprite && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;
        this.updateAI(time, delta);
        super.update(time, delta);
    }

    updateAI(time, delta) {
        // Always scan for nearby player units (priority target)
        let closestUnit = null;
        let closestUnitDist = 3 * TILE_SIZE;
        for (const unit of this.scene.playerUnits) {
            if (!unit.alive || !unit.sprite) continue;
            const d = this.distanceTo(unit);
            if (d < closestUnitDist) {
                closestUnit = unit;
                closestUnitDist = d;
            }
        }

        // Switch to nearby player unit if current target is a building
        if (closestUnit && (!this.attackTarget || this.attackTarget.type !== 'warrior')) {
            this.attackTarget = closestUnit;
        }

        // Pursue current target
        if (this.attackTarget && this.attackTarget.alive) {
            const dist = this.distanceTo(this.attackTarget);
            const range = this.attackRange * TILE_SIZE;

            if (dist <= range) {
                if (this.state !== UnitState.ATTACKING) {
                    this.state = UnitState.ATTACKING;
                    this.playAnim('attack');
                    this.path = [];
                }
                this.performAttack(time);
            } else if (this.state !== UnitState.MOVING) {
                this.moveTo(this.attackTarget.sprite.x, this.attackTarget.sprite.y);
            }
            return;
        }

        // No target — find a building
        this.attackTarget = null;
        let targetBuilding = null;
        let bestDist = Infinity;
        for (const b of this.scene.buildings) {
            if (!b.alive || b.faction === 'neutral') continue;
            const center = b.getCenter();
            const d = this.distanceToPoint(center.x, center.y);
            if (d < bestDist) {
                bestDist = d;
                targetBuilding = b;
            }
        }

        if (targetBuilding) {
            this.attackTarget = targetBuilding;
            const center = targetBuilding.getCenter();
            this.moveTo(center.x, center.y);
        }
    }

    performAttack(time) {
        if (time - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = time;
        if (this.attackTarget && this.attackTarget.alive) {
            this.attackTarget.takeDamage(this.attackDamage);
            if (!this.attackTarget.alive) {
                this.attackTarget = null;
                this.stopMoving();
            }
        }
    }
}
