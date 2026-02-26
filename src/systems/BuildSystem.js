import { TILE_SIZE, GRID_COLS, GRID_ROWS, PLAYER_ZONE_MAX_X } from '../config/gameConfig.js';
import Barracks from '../entities/Barracks.js';

export default class BuildSystem {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.buildingType = null;
        this.ghostSprite = null;
        this.ghostTint = null; // green/red overlay
        this.gridW = 0;
        this.gridH = 0;

        this.setupInput();
    }

    setupInput() {
        this.scene.input.on('pointermove', (pointer) => {
            if (!this.active) return;
            this.updateGhost(pointer);
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (!this.active) return;
            if (pointer.leftButtonDown()) {
                this.confirmPlacement(pointer);
            } else if (pointer.rightButtonDown()) {
                this.cancelBuild();
            }
        });
    }

    enterBuildMode(type) {
        this.active = true;
        this.buildingType = type;

        if (type === 'barracks') {
            this.gridW = 3;
            this.gridH = 4;
            this.ghostSprite = this.scene.add.image(0, 0, 'barracks');
            this.ghostSprite.setAlpha(0.6);
            this.ghostSprite.setDepth(2000);
        }
    }

    updateGhost(pointer) {
        if (!this.ghostSprite) return;

        const grid = this.scene.gridSystem.pixelToGrid(pointer.worldX, pointer.worldY);
        const gx = grid.gx;
        const gy = grid.gy;

        // Snap to grid
        const px = gx * TILE_SIZE + (this.gridW * TILE_SIZE) / 2;
        const py = gy * TILE_SIZE + (this.gridH * TILE_SIZE) / 2;
        this.ghostSprite.setPosition(px, py);

        // Check if placement is valid
        const canPlace = this.canPlaceAt(gx, gy);
        this.ghostSprite.setTint(canPlace ? 0x00ff00 : 0xff0000);
    }

    canPlaceAt(gx, gy) {
        // Must be in player zone
        if (gx + this.gridW - 1 > PLAYER_ZONE_MAX_X) return false;

        // Must be within grass area (1 tile border)
        if (gx < 1 || gy < 1 || gx + this.gridW > GRID_COLS - 1 || gy + this.gridH > GRID_ROWS - 1) return false;

        // Must be free
        return this.scene.gridSystem.isFree(gx, gy, this.gridW, this.gridH);
    }

    confirmPlacement(pointer) {
        const grid = this.scene.gridSystem.pixelToGrid(pointer.worldX, pointer.worldY);
        const gx = grid.gx;
        const gy = grid.gy;

        if (!this.canPlaceAt(gx, gy)) return;

        // Check cost
        const cost = this.getCost();
        if (!this.scene.resourceSystem.spendGold(cost)) return;

        // Place building
        let building = null;
        if (this.buildingType === 'barracks') {
            building = new Barracks(this.scene, this.scene.gridSystem, gx, gy);
        }

        if (building) {
            this.scene.buildings.push(building);
        }

        this.cancelBuild();
    }

    getCost() {
        if (this.buildingType === 'barracks') return Barracks.cost;
        return 0;
    }

    cancelBuild() {
        this.active = false;
        this.buildingType = null;
        if (this.ghostSprite) {
            this.ghostSprite.destroy();
            this.ghostSprite = null;
        }
    }
}
