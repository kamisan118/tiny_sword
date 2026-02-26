import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { TILE_SIZE } from '../config/gameConfig.js';

export default class GoblinTNT extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'goblin_tnt', {
            hp: 30,
            speed: 50,
            attackDamage: 80,
            attackRange: 1.5,
            attackCooldown: 0, // one-time explosion
            faction: 'enemy',
            type: 'goblin_tnt',
            frameSize: 192
        });

        this.hasExploded = false;
        this.initAnims();
        this.playAnim('idle');
    }

    // TNT_Red.png: 7 cols × 3 rows (192×192 frames)
    // Row 0: idle (0-6), Row 1: run (7-13), Row 2: explode (14-20)
    initAnims() {
        createAnim(this.scene, 'goblin_tnt_idle', 'goblin_tnt', 0, 6, 8);
        createAnim(this.scene, 'goblin_tnt_run', 'goblin_tnt', 7, 13, 10);
        createAnim(this.scene, 'goblin_tnt_explode', 'goblin_tnt', 14, 20, 10, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'goblin_tnt_idle',
            run: 'goblin_tnt_run',
            explode: 'goblin_tnt_explode'
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
        if (this.hasExploded) return;

        if (this.attackTarget && this.attackTarget.alive) {
            const dist = this.distanceTo(this.attackTarget);
            const range = this.attackRange * TILE_SIZE;

            if (dist <= range) {
                this.explode();
            } else if (this.state !== UnitState.MOVING) {
                if (this.attackTarget.sprite) {
                    this.moveTo(this.attackTarget.sprite.x, this.attackTarget.sprite.y);
                } else {
                    const center = this.attackTarget.getCenter();
                    this.moveTo(center.x, center.y);
                }
            }
            return;
        }

        this.attackTarget = null;

        // Find closest building to rush
        let targetBuilding = null;
        let bestDist = Infinity;
        for (const b of this.scene.buildings) {
            if (!b.alive || b.faction === 'neutral') continue;
            const center = b.getCenter();
            const d = this.distanceToPoint(center.x, center.y);
            const weight = b.type === 'castle' ? 0.5 : 1;
            if (d * weight < bestDist) { bestDist = d * weight; targetBuilding = b; }
        }
        if (targetBuilding) {
            this.attackTarget = targetBuilding;
            const center = targetBuilding.getCenter();
            this.moveTo(center.x, center.y);
        }
    }

    explode() {
        if (this.hasExploded) return;
        this.hasExploded = true;
        this.state = UnitState.ATTACKING;
        this.playAnim('explode');

        // Deal damage to target
        if (this.attackTarget && this.attackTarget.alive) {
            this.attackTarget.takeDamage(this.attackDamage);
        }

        // Self-destruct after animation
        if (this.sprite) {
            this.sprite.once('animationcomplete', () => {
                this.die();
            });
        }
    }
}
