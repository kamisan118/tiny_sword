import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE } from '../config/gameConfig.js';

const SCROLL_SPEED = 300; // pixels per second
const ARROW_SIZE = 32;
const ARROW_MARGIN = 12;
const ARROW_ALPHA = 0.5;
const ARROW_DEPTH = 2000;

export default class CameraSystem {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;

        // Scroll direction state
        this.scrollDir = { x: 0, y: 0 };

        this._createArrowButtons();
        this._setupKeyboard();
    }

    _createArrowButtons() {
        const s = this.scene;
        const hw = VIEWPORT_WIDTH / 2;
        const hh = VIEWPORT_HEIGHT / 2;

        // Create 4 triangle arrow buttons at inner edges of grass viewport
        this.arrows = {
            up:    this._createArrow(s, hw, TILE_SIZE + ARROW_MARGIN, 0),
            down:  this._createArrow(s, hw, VIEWPORT_HEIGHT - TILE_SIZE - ARROW_MARGIN, Math.PI),
            left:  this._createArrow(s, TILE_SIZE + ARROW_MARGIN, hh, -Math.PI / 2),
            right: this._createArrow(s, VIEWPORT_WIDTH - TILE_SIZE - ARROW_MARGIN, hh, Math.PI / 2),
        };

        // Bind pointerdown / pointerup / pointerout
        this._bindArrow(this.arrows.up,    0, -1);
        this._bindArrow(this.arrows.down,  0,  1);
        this._bindArrow(this.arrows.left, -1,  0);
        this._bindArrow(this.arrows.right, 1,  0);
    }

    _createArrow(scene, x, y, rotation) {
        const g = scene.add.graphics();
        g.fillStyle(0xfef3c0, ARROW_ALPHA);
        g.lineStyle(2, 0x3a2a14, ARROW_ALPHA);
        const s = ARROW_SIZE;
        g.fillTriangle(-s / 2, s / 3, s / 2, s / 3, 0, -s / 3);
        g.strokeTriangle(-s / 2, s / 3, s / 2, s / 3, 0, -s / 3);
        g.setScrollFactor(0);
        g.setDepth(ARROW_DEPTH);
        g.setPosition(x, y);
        g.rotation = rotation;
        scene.showOnBgCamera(g);

        // Hit area for interaction
        const hitZone = scene.add.zone(x, y, ARROW_SIZE * 1.5, ARROW_SIZE * 1.5)
            .setScrollFactor(0).setDepth(ARROW_DEPTH).setInteractive();
        hitZone._arrowGraphics = g;
        scene.showOnBgCamera(hitZone);

        return hitZone;
    }

    _bindArrow(zone, dx, dy) {
        let active = false;
        zone.on('pointerdown', () => {
            if (!active) {
                active = true;
                this.scrollDir.x += dx;
                this.scrollDir.y += dy;
                zone._arrowGraphics.setAlpha(1);
            }
        });
        const stop = () => {
            if (active) {
                active = false;
                this.scrollDir.x -= dx;
                this.scrollDir.y -= dy;
                zone._arrowGraphics.setAlpha(ARROW_ALPHA);
            }
        };
        zone.on('pointerup', stop);
        zone.on('pointerout', stop);
    }

    _setupKeyboard() {
        const cursors = this.scene.input.keyboard.createCursorKeys();
        this.cursors = cursors;
    }

    update(time, delta) {
        const dt = delta / 1000;
        let dx = this.scrollDir.x;
        let dy = this.scrollDir.y;

        // Keyboard arrow keys
        if (this.cursors.left.isDown)  dx -= 1;
        if (this.cursors.right.isDown) dx += 1;
        if (this.cursors.up.isDown)    dy -= 1;
        if (this.cursors.down.isDown)  dy += 1;

        // Clamp to -1..1
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));

        // Apply scroll
        if (dx !== 0 || dy !== 0) {
            this.camera.scrollX += dx * SCROLL_SPEED * dt;
            this.camera.scrollY += dy * SCROLL_SPEED * dt;
        }

        // Update arrow visibility based on camera bounds
        const cam = this.camera;
        const minX = cam._bounds.x;
        const minY = cam._bounds.y;
        const maxX = cam._bounds.right - cam.width;
        const maxY = cam._bounds.bottom - cam.height;

        this.arrows.left.visible = cam.scrollX > minX;
        this.arrows.left._arrowGraphics.visible = this.arrows.left.visible;
        this.arrows.right.visible = cam.scrollX < maxX;
        this.arrows.right._arrowGraphics.visible = this.arrows.right.visible;
        this.arrows.up.visible = cam.scrollY > minY;
        this.arrows.up._arrowGraphics.visible = this.arrows.up.visible;
        this.arrows.down.visible = cam.scrollY < maxY;
        this.arrows.down._arrowGraphics.visible = this.arrows.down.visible;
    }
}
