import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';

const SCROLL_SPEED = 300; // pixels per second
const EDGE_THRESHOLD = 40; // pixels from edge to trigger scrolling

export default class CameraSystem {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;

        this._setupKeyboard();
    }

    _setupKeyboard() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
    }

    update(time, delta) {
        const dt = delta / 1000;
        let dx = 0;
        let dy = 0;

        // Mouse edge scrolling
        const pointer = this.scene.input.activePointer;
        const mx = pointer.x;
        const my = pointer.y;

        const left = 1;
        const right = VIEWPORT_WIDTH - 1;
        const top = 1;
        const bottom = VIEWPORT_HEIGHT - 1;

        if (mx >= left && mx <= right && my >= top && my <= bottom) {
            // Pointer is inside the grass viewport area
            if (mx - left < EDGE_THRESHOLD)  dx = -1;
            if (right - mx < EDGE_THRESHOLD) dx = 1;
            if (my - top < EDGE_THRESHOLD)   dy = -1;
            if (bottom - my < EDGE_THRESHOLD) dy = 1;
        }

        // Keyboard arrow keys
        if (this.cursors.left.isDown)  dx = -1;
        if (this.cursors.right.isDown) dx = 1;
        if (this.cursors.up.isDown)    dy = -1;
        if (this.cursors.down.isDown)  dy = 1;

        // Apply scroll
        if (dx !== 0 || dy !== 0) {
            this.camera.scrollX += dx * SCROLL_SPEED * dt;
            this.camera.scrollY += dy * SCROLL_SPEED * dt;
        }
    }
}
