import { GAME_WIDTH, GAME_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';
import { UnitState } from '../entities/Unit.js';

export default class Minimap {
    constructor(scene) {
        this.scene = scene;
        this.visible = true;

        // Minimap dimensions
        this.width = 200;
        this.height = 120;
        this.padding = 16;

        // Position in bottom-right corner
        this.x = VIEWPORT_WIDTH - this.width - this.padding;
        this.y = VIEWPORT_HEIGHT - this.height - this.padding;

        // Scale factors: map size to minimap size
        this.scaleX = this.width / GAME_WIDTH;
        this.scaleY = this.height / GAME_HEIGHT;

        // Create container for all minimap elements
        // Depth 10056: above BuildMenu backdrop (10050) and buttons (10054-10055)
        this.container = scene.add.container(this.x, this.y);
        this.container.setScrollFactor(0).setDepth(10056);

        // Background (semi-transparent dark)
        this.background = scene.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7);
        this.background.setOrigin(0, 0);
        this.container.add(this.background);

        // RenderTexture for terrain and units
        this.renderTexture = scene.add.renderTexture(0, 0, this.width, this.height);
        this.renderTexture.setOrigin(0, 0);
        this.container.add(this.renderTexture);

        // Viewport frame (white rectangle showing camera view)
        this.viewportFrame = scene.add.graphics();
        this.viewportFrame.lineStyle(1, 0xffffff, 1);
        this.container.add(this.viewportFrame);

        // Border around minimap
        this.border = scene.add.graphics();
        this.border.lineStyle(2, 0x666666, 1);
        this.border.strokeRect(0, 0, this.width, this.height);
        this.container.add(this.border);

        // Make minimap interactive for click-to-move camera
        this.background.setInteractive();
        console.log('🎯 Minimap background made interactive:', {
            interactive: this.background.input?.enabled,
            bounds: this.background.getBounds(),
            depth: this.container.depth,
            visible: this.background.visible
        });
        this.background.on('pointerdown', (pointer) => this.onMinimapClick(pointer));

        // M key to toggle visibility
        scene.input.keyboard.on('keydown-M', () => this.toggle());

        // Initial render
        this.render();
    }

    render() {
        if (!this.visible) return;

        this.renderTexture.clear();

        // Draw terrain
        this.renderTerrain();

        // Draw units and buildings
        this.renderUnits();

        // Update viewport frame
        this.updateViewportFrame();
    }

    renderTerrain() {
        const map = this.scene.currentMap;
        if (!map || !map.terrain) return;

        const graphics = this.scene.add.graphics();

        // Draw terrain tiles
        for (let gy = 0; gy < GRID_ROWS; gy++) {
            for (let gx = 0; gx < GRID_COLS; gx++) {
                const terrainType = map.terrain[gy][gx];
                let color = 0x88cc88; // Default light green for grass

                switch (terrainType) {
                    case 'W': // Water
                        color = 0x444444;
                        break;
                    case 'E': // Elevation
                        color = 0x555555;
                        break;
                    case 'S': // Sand
                        color = 0xdddd88;
                        break;
                    case 'G': // Grass
                    default:
                        color = 0x88cc88;
                        break;
                }

                const worldX = gx * 64;
                const worldY = gy * 64;
                const minimapX = worldX * this.scaleX;
                const minimapY = worldY * this.scaleY;
                const tileWidth = 64 * this.scaleX;
                const tileHeight = 64 * this.scaleY;

                graphics.fillStyle(color, 1);
                graphics.fillRect(minimapX, minimapY, tileWidth, tileHeight);
            }
        }

        // Render terrain to texture
        this.renderTexture.draw(graphics, 0, 0);
        graphics.destroy();
    }

    renderUnits() {
        const graphics = this.scene.add.graphics();

        // Draw enemy units (red dots)
        for (const unit of this.scene.enemyUnits) {
            if (!unit.alive) continue;

            const minimapX = unit.x * this.scaleX;
            const minimapY = unit.y * this.scaleY;

            graphics.fillStyle(0xff4444, 1);
            graphics.fillCircle(minimapX, minimapY, 2);
        }

        // Draw player units and buildings (blue dots, flash red when in combat)
        const flashCycle = Math.floor(this.scene.time.now / 500) % 2; // 500ms cycle
        for (const unit of this.scene.playerUnits) {
            if (!unit.alive) continue;

            const minimapX = unit.x * this.scaleX;
            const minimapY = unit.y * this.scaleY;

            // Flash red if unit is attacking, otherwise stay blue
            const isInCombat = unit.state === UnitState.ATTACKING;
            const color = (isInCombat && flashCycle === 1) ? 0xff4444 : 0x4444ff;

            graphics.fillStyle(color, 1);
            graphics.fillCircle(minimapX, minimapY, 2);
        }

        // Draw buildings (blue dots, slightly larger)
        for (const building of this.scene.buildings) {
            if (!building.alive) continue;

            const center = building.getCenter();
            const minimapX = center.x * this.scaleX;
            const minimapY = center.y * this.scaleY;

            graphics.fillStyle(0x4444ff, 1);
            graphics.fillCircle(minimapX, minimapY, 3);
        }

        // Render units to texture
        this.renderTexture.draw(graphics, 0, 0);
        graphics.destroy();
    }

    updateViewportFrame() {
        this.viewportFrame.clear();

        const cam = this.scene.cameras.main;
        const frameX = cam.scrollX * this.scaleX;
        const frameY = cam.scrollY * this.scaleY;
        const frameWidth = VIEWPORT_WIDTH * this.scaleX;
        const frameHeight = VIEWPORT_HEIGHT * this.scaleY;

        this.viewportFrame.lineStyle(1, 0xffffff, 1);
        this.viewportFrame.strokeRect(frameX, frameY, frameWidth, frameHeight);
    }

    onMinimapClick(pointer) {
        console.log('🎯🎯🎯 MINIMAP CLICK HANDLER FIRED! 🎯🎯🎯');
        console.log('Minimap visible?', this.visible);
        console.log('Background interactive?', this.background.input?.enabled);

        if (!this.visible) {
            console.log('❌ Minimap not visible, returning early');
            return;
        }

        console.log('=== MINIMAP CLICK DEBUG - REAL POINTER VALUES ===');
        console.log('REAL POINTER EVENT:', {
            x: pointer.x,
            y: pointer.y,
            worldX: pointer.worldX,
            worldY: pointer.worldY,
            downX: pointer.downX,
            downY: pointer.downY,
            upX: pointer.upX,
            upY: pointer.upY,
            positionX: pointer.position?.x,
            positionY: pointer.position?.y
        });
        console.log('Minimap position - this.x:', this.x, 'this.y:', this.y);
        console.log('Minimap scale - this.scaleX:', this.scaleX, 'this.scaleY:', this.scaleY);

        const camera = this.scene.cameras.main;
        console.log('Camera before - scrollX:', camera.scrollX, 'scrollY:', camera.scrollY);

        // For UI elements with setScrollFactor(0), pointer.x/y are in screen space
        // Just need to convert from screen space to minimap local coordinates
        const localX = pointer.x - this.x;
        const localY = pointer.y - this.y;
        console.log('Calculated localX:', localX, 'localY:', localY);

        // Convert minimap coordinates to world coordinates
        const worldX = localX / this.scaleX;
        const worldY = localY / this.scaleY;
        console.log('Calculated worldX:', worldX, 'worldY:', worldY);

        // Center camera on clicked position
        camera.centerOn(worldX, worldY);
        console.log('Camera after - scrollX:', camera.scrollX, 'scrollY:', camera.scrollY);
        console.log('=================================================');
    }

    toggle() {
        this.visible = !this.visible;
        this.container.setVisible(this.visible);
    }

    update() {
        if (!this.visible) return;
        this.render();
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
