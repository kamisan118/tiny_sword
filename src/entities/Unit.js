import { TILE_SIZE } from '../config/gameConfig.js';
import { findPath } from '../utils/Pathfinding.js';
import HealthBar from '../ui/HealthBar.js';

let nextUnitId = 1;

export const UnitState = {
    IDLE: 'idle',
    MOVING: 'moving',
    ATTACKING: 'attacking',
    DEAD: 'dead'
};

export default class Unit {
    constructor(scene, gridSystem, gx, gy, textureKey, config) {
        this.id = `unit_${nextUnitId++}`;
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.faction = config.faction || 'player';
        this.type = config.type || 'unit';

        this.maxHp = config.hp;
        this.hp = config.hp;
        this.speed = config.speed;
        this.alive = true;
        this.selected = false;

        this.state = UnitState.IDLE;
        this.path = [];
        this.pathIndex = 0;
        this.targetX = 0;
        this.targetY = 0;

        // Attack properties
        this.attackDamage = config.attackDamage || 0;
        this.attackRange = config.attackRange || 0;
        this.attackCooldown = config.attackCooldown || 1000;
        this.lastAttackTime = 0;
        this.attackTarget = null;

        // Create sprite at grid position
        const pos = gridSystem.gridToPixel(gx, gy);
        this.sprite = scene.add.sprite(pos.x, pos.y, textureKey);
        this.sprite.setDepth(pos.y);

        // Scale down from 192×192 to ~64×64 for display
        const scale = config.displayScale || (TILE_SIZE / config.frameSize);
        this.sprite.setScale(scale);

        // Store reference back to unit on sprite for click detection
        this.sprite.setInteractive();
        this.sprite.unitRef = this;

        // Selection indicator (hidden by default)
        this.selectionCircle = scene.add.image(pos.x, pos.y, 'ui_cursor_select');
        this.selectionCircle.setScale(0.7);
        this.selectionCircle.setVisible(false);
        this.selectionCircle.setDepth(pos.y - 1);

        // Health bar
        this.healthBar = new HealthBar(scene, this, -25, 36);
    }

    update(time, delta) {
        if (!this.alive) return;

        switch (this.state) {
            case UnitState.MOVING:
                this.updateMovement(delta);
                break;
        }

        // Update depth for y-sorting
        this.sprite.setDepth(this.sprite.y);

        // Update selection indicator position
        this.selectionCircle.setPosition(this.sprite.x, this.sprite.y);
        this.selectionCircle.setDepth(this.sprite.y - 1);

        // Update health bar
        if (this.healthBar) this.healthBar.update();
    }

    // Direct move to pixel position (no pathfinding)
    moveTo(px, py) {
        this.finalTargetX = px;
        this.finalTargetY = py;
        this.targetX = px;
        this.targetY = py;
        this.state = UnitState.MOVING;
        this.path = [];
        this.pathIndex = 0;
        this.playAnim('run');

        // Flip sprite based on direction
        if (px < this.sprite.x) {
            this.sprite.setFlipX(true);
        } else if (px > this.sprite.x) {
            this.sprite.setFlipX(false);
        }
    }

    // Move to pixel position using A* pathfinding
    moveToWithPathfinding(px, py) {
        const start = this.getGridPos();
        const end = this.gridSystem.pixelToGrid(px, py);
        const path = findPath(this.gridSystem, start.gx, start.gy, end.gx, end.gy);

        if (path && path.length > 0) {
            this.moveAlongPath(path);
        } else if (path && path.length === 0) {
            // Already at destination
            this.stopMoving();
        } else {
            // No path found, try direct move as fallback
            this.moveTo(px, py);
        }
    }

    moveAlongPath(path) {
        if (!path || path.length === 0) return;
        this.path = path;
        this.pathIndex = 0;
        this.state = UnitState.MOVING;
        this.playAnim('run');
        this._advanceToNextPathPoint();
    }

    _advanceToNextPathPoint() {
        if (this.pathIndex >= this.path.length) {
            // Path complete — resume direct move to final target if set
            if (this.finalTargetX !== undefined) {
                const fx = this.finalTargetX;
                const fy = this.finalTargetY;
                this.path = [];
                this.pathIndex = 0;
                this.targetX = fx;
                this.targetY = fy;
                // Don't call moveTo to avoid resetting finalTarget
            } else {
                this.stopMoving();
            }
            return;
        }
        const point = this.path[this.pathIndex];
        const pos = this.gridSystem.gridToPixel(point.gx, point.gy);
        this.targetX = pos.x;
        this.targetY = pos.y;

        // Flip sprite based on direction
        const dx = this.targetX - this.sprite.x;
        if (dx < -1) this.sprite.setFlipX(true);
        else if (dx > 1) this.sprite.setFlipX(false);
    }

    updateMovement(delta) {
        const dx = this.targetX - this.sprite.x;
        const dy = this.targetY - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
            this.sprite.x = this.targetX;
            this.sprite.y = this.targetY;

            // If following a path, move to next point
            if (this.path.length > 0) {
                this.pathIndex++;
                this._advanceToNextPathPoint();
            } else {
                this.stopMoving();
            }
            return;
        }

        const step = (this.speed * delta) / 1000;
        const nx = dx / dist;
        const ny = dy / dist;
        const newX = this.sprite.x + nx * step;
        const newY = this.sprite.y + ny * step;

        // Check if new position enters an occupied grid cell
        const newGrid = this.gridSystem.pixelToGrid(newX, newY);
        if (!this.gridSystem.isWalkable(newGrid.gx, newGrid.gy)) {
            // Allow movement if the occupied cell belongs to the attack target
            const cellId = this.gridSystem.grid[newGrid.gy]?.[newGrid.gx];
            if (this.attackTarget && cellId === this.attackTarget.id) {
                // OK — approaching attack target building
            } else if (this.path.length === 0) {
                // Hit a building during direct move — pathfind around it
                this._detourAroundObstacle();
                return;
            } else {
                this.stopMoving();
                return;
            }
        }

        this.sprite.x = newX;
        this.sprite.y = newY;

        // Flip sprite based on movement direction
        if (dx < -1) this.sprite.setFlipX(true);
        else if (dx > 1) this.sprite.setFlipX(false);

        // Dust trail particles
        this._dustTimer = (this._dustTimer || 0) + delta;
        if (this._dustTimer > 200) {
            this._dustTimer = 0;
            this.spawnDust();
        }
    }

    spawnDust() {
        if (!this.sprite || !this.scene) return;
        const x = this.sprite.x + (Math.random() - 0.5) * 10;
        const y = this.sprite.y + 20;
        const dust = this.scene.add.circle(x, y, 3, 0xccaa77, 0.5);
        dust.setDepth(this.sprite.y - 2);
        this.scene.tweens.add({
            targets: dust,
            y: y - 12,
            alpha: 0,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 400,
            onComplete: () => dust.destroy()
        });
    }

    _detourAroundObstacle() {
        const start = this.getGridPos();
        const end = this.gridSystem.pixelToGrid(this.finalTargetX, this.finalTargetY);
        const fullPath = findPath(this.gridSystem, start.gx, start.gy, end.gx, end.gy);

        if (!fullPath || fullPath.length === 0) {
            this.stopMoving();
            return;
        }

        // Truncate: keep path only until the first point with clear line of sight to final target
        let truncated = fullPath;
        for (let i = 0; i < fullPath.length; i++) {
            if (this.gridSystem.hasLineOfSight(fullPath[i].gx, fullPath[i].gy, end.gx, end.gy)) {
                truncated = fullPath.slice(0, i + 1);
                break;
            }
        }

        this.moveAlongPath(truncated);
    }

    stopMoving() {
        this.state = UnitState.IDLE;
        this.path = [];
        this.pathIndex = 0;
        this.finalTargetX = undefined;
        this.finalTargetY = undefined;
        this.playAnim('idle');
    }

    setSelected(selected) {
        this.selected = selected;
        this.selectionCircle.setVisible(selected);

        // Pulse animation on select
        if (selected && this.scene && this.scene.tweens) {
            if (this._selectTween) this._selectTween.destroy();
            this.selectionCircle.setScale(0.7);
            this.selectionCircle.setAlpha(1);
            this._selectTween = this.scene.tweens.add({
                targets: this.selectionCircle,
                scaleX: 0.85,
                scaleY: 0.85,
                alpha: 0.6,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (this._selectTween) {
            this._selectTween.destroy();
            this._selectTween = null;
            if (this.selectionCircle) {
                this.selectionCircle.setScale(0.7);
                this.selectionCircle.setAlpha(1);
            }
        }
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.state = UnitState.DEAD;
        if (this.healthBar) { this.healthBar.destroy(); this.healthBar = null; }
        if (this.selectionCircle) { this.selectionCircle.destroy(); this.selectionCircle = null; }

        // Try to play death animation, then clean up
        if (this.sprite && this.hasDeathAnim) {
            this.playAnim('death');
            this.sprite.once('animationcomplete', () => {
                this.cleanup();
            });
        } else {
            this.cleanup();
        }
    }

    cleanup() {
        // Spawn explosion effect at death position
        if (this.sprite && this.scene) {
            this.spawnDeathEffect(this.sprite.x, this.sprite.y);
        }
        if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
    }

    spawnDeathEffect(x, y) {
        const explosion = this.scene.add.sprite(x, y, 'explosions');
        explosion.setScale(0.5);
        explosion.setDepth(y + 5000);
        if (!this.scene.anims.exists('explosion_anim')) {
            this.scene.anims.create({
                key: 'explosion_anim',
                frames: this.scene.anims.generateFrameNumbers('explosions', { start: 0, end: 8 }),
                frameRate: 15,
                repeat: 0
            });
        }
        explosion.play('explosion_anim');
        explosion.once('animationcomplete', () => explosion.destroy());
    }

    playAnim(_name) {
        // Override in subclass
    }

    getGridPos() {
        return this.gridSystem.pixelToGrid(this.sprite.x, this.sprite.y);
    }

    distanceTo(other) {
        if (!this.sprite || !other.sprite) return Infinity;
        const dx = this.sprite.x - other.sprite.x;
        const dy = this.sprite.y - other.sprite.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distanceToPoint(px, py) {
        const dx = this.sprite.x - px;
        const dy = this.sprite.y - py;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
