import Unit, { UnitState } from './Unit.js';
import { createAnim } from '../utils/SpriteHelper.js';
import { WARRIOR_HP, WARRIOR_SPEED, WARRIOR_DAMAGE, WARRIOR_ATTACK_RANGE, WARRIOR_COOLDOWN, TILE_SIZE } from '../config/gameConfig.js';

export default class Warrior extends Unit {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 'warrior_idle', {
            hp: WARRIOR_HP,
            speed: WARRIOR_SPEED,
            attackDamage: WARRIOR_DAMAGE,
            attackRange: WARRIOR_ATTACK_RANGE,
            attackCooldown: WARRIOR_COOLDOWN,
            faction: 'player',
            type: 'warrior',
            frameSize: 192
        });

        this.initAnims();
        this.playAnim('idle');
    }

    initAnims() {
        createAnim(this.scene, 'warrior_idle_anim', 'warrior_idle', 0, 7, 8);
        createAnim(this.scene, 'warrior_run_anim', 'warrior_run', 0, 5, 10);
        createAnim(this.scene, 'warrior_attack_anim', 'warrior_attack', 0, 3, 8, 0);
    }

    playAnim(name) {
        const map = {
            idle: 'warrior_idle_anim',
            run: 'warrior_run_anim',
            attack: 'warrior_attack_anim'
        };
        const animKey = map[name];
        if (animKey && this.sprite.anims) {
            this.sprite.play(animKey, true);
        }
    }

    update(time, delta) {
        if (!this.alive) return;

        // If attacking a target, pursue it
        if (this.attackTarget && this.attackTarget.alive && this.attackTarget.sprite) {
            const dist = this.distanceTo(this.attackTarget);
            const range = this.attackRange * TILE_SIZE;

            if (dist <= range) {
                // In range — attack
                if (this.state !== UnitState.ATTACKING) {
                    this.state = UnitState.ATTACKING;
                    this.playAnim('attack');
                    this.path = [];
                }
                this.performAttack(time);

                // Face target
                if (this.attackTarget && this.attackTarget.sprite) {
                    if (this.attackTarget.sprite.x < this.sprite.x) {
                        this.sprite.setFlipX(true);
                    } else {
                        this.sprite.setFlipX(false);
                    }
                }
            } else {
                // Chase target
                if (this.state !== UnitState.MOVING) {
                    this.moveTo(this.attackTarget.sprite.x, this.attackTarget.sprite.y);
                }
            }
        } else if (this.attackTarget || this.state === UnitState.ATTACKING) {
            // Target dead or gone
            this.attackTarget = null;
            this.stopMoving();
        }

        // Auto-aggro: if idle, look for nearby enemies
        if (this.state === UnitState.IDLE && !this.attackTarget) {
            this.scanForEnemies();
        }

        super.update(time, delta);
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

    scanForEnemies() {
        const detectRange = 3 * TILE_SIZE;
        let closest = null;
        let closestDist = Infinity;

        for (const enemy of this.scene.enemyUnits) {
            if (!enemy.alive) continue;
            const dist = this.distanceTo(enemy);
            if (dist < detectRange && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }

        if (closest) {
            this.attackTarget = closest;
        }
    }
}
