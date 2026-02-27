import { TILE_SIZE, GRID_COLS, GRID_ROWS } from '../config/gameConfig.js';
import GridSystem from '../systems/GridSystem.js';
import Castle from '../entities/Castle.js';
import SelectionSystem from '../systems/SelectionSystem.js';
import CommandSystem from '../systems/CommandSystem.js';
import ResourceSystem from '../systems/ResourceSystem.js';
import EventBus from '../utils/EventBus.js';
import HUD from '../ui/HUD.js';
import BuildSystem from '../systems/BuildSystem.js';
import BuildMenu from '../ui/BuildMenu.js';
import CombatSystem from '../systems/CombatSystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import GameAPI from '../api/GameAPI.js';

// Tilemap_Flat frame indices (10 cols × 4 rows)
// Green grass: top-left corner at (0,0), center fill at (1,1)
const GRASS = {
    TL: 0,  T: 1,  TR: 2,
    L: 10,  C: 11, R: 12,
    BL: 20, B: 21, BR: 22
};

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.gridSystem = new GridSystem();
        this.buildings = [];
        this.playerUnits = [];
        this.enemyUnits = [];

        this.renderTerrain();
        this.placeStartingBuildings();

        // Systems
        this.eventBus = new EventBus();
        this.resourceSystem = new ResourceSystem(this.eventBus);
        this.commandSystem = new CommandSystem(this);
        this.selectionSystem = new SelectionSystem(this);
        this.hud = new HUD(this, this.eventBus);
        this.buildSystem = new BuildSystem(this);
        this.buildMenu = new BuildMenu(this);
        this.combatSystem = new CombatSystem(this);
        this.waveSystem = new WaveSystem(this);

        this.gameOver = false;
        this.gameResult = null; // 'victory' or 'defeat'

        // Expose GameAPI for Playwright testing
        window.gameAPI = new GameAPI(this);

        console.log('GameScene started');
    }

    placeStartingBuildings() {
        // Castle at grid (1, 4)
        this.castle = new Castle(this, this.gridSystem, 1, 4);
        this.buildings.push(this.castle);
    }

    renderTerrain() {
        // Water background fill
        for (let gy = 0; gy < GRID_ROWS; gy++) {
            for (let gx = 0; gx < GRID_COLS; gx++) {
                const { x, y } = this.gridSystem.gridToPixel(gx, gy);
                this.add.image(x, y, 'water');
            }
        }

        // Grass island — leave 1 tile water border on edges
        const grassLeft = 1;
        const grassRight = GRID_COLS - 2;
        const grassTop = 1;
        const grassBottom = GRID_ROWS - 2;

        for (let gy = grassTop; gy <= grassBottom; gy++) {
            for (let gx = grassLeft; gx <= grassRight; gx++) {
                const { x, y } = this.gridSystem.gridToPixel(gx, gy);
                let frame = GRASS.C;

                // Determine edge/corner
                const isTop = gy === grassTop;
                const isBottom = gy === grassBottom;
                const isLeft = gx === grassLeft;
                const isRight = gx === grassRight;

                if (isTop && isLeft) frame = GRASS.TL;
                else if (isTop && isRight) frame = GRASS.TR;
                else if (isBottom && isLeft) frame = GRASS.BL;
                else if (isBottom && isRight) frame = GRASS.BR;
                else if (isTop) frame = GRASS.T;
                else if (isBottom) frame = GRASS.B;
                else if (isLeft) frame = GRASS.L;
                else if (isRight) frame = GRASS.R;

                this.add.image(x, y, 'tilemap_flat', frame);
            }
        }
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update all player units
        for (const unit of this.playerUnits) {
            unit.update(time, delta);
        }
        // Update all enemy units
        for (const unit of this.enemyUnits) {
            unit.update(time, delta);
        }

        // Update combat system
        this.combatSystem.update(time, delta);

        // Update buildings (production timers)
        for (const building of this.buildings) {
            if (building.update) building.update(time, delta);
        }

        // Update wave system
        this.waveSystem.update(time, delta);

        // Clean up dead units
        this.playerUnits = this.playerUnits.filter(u => u.alive);
        this.enemyUnits = this.enemyUnits.filter(u => u.alive);

        // Check win/lose conditions
        this.checkGameOver();
    }

    checkGameOver() {
        // Defeat: castle destroyed
        if (!this.castle.alive) {
            this.endGame('defeat');
            return;
        }

        // Victory: all waves spawned and all enemies dead
        if (this.waveSystem.isVictory()) {
            this.endGame('victory');
        }
    }

    endGame(result) {
        this.gameOver = true;
        this.gameResult = result;
        this.waveSystem.gameOver = true;

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Darken overlay
        const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
        overlay.setScrollFactor(0).setDepth(5000);

        // Result text
        const titleStyle = { fontSize: '64px', color: result === 'victory' ? '#ffdd44' : '#ff4444',
                             fontFamily: 'Arial', stroke: '#000000', strokeThickness: 6 };
        const title = result === 'victory' ? 'VICTORY' : 'DEFEAT';
        this.add.text(cx, cy - 60, title, titleStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        // Play again button
        const btnStyle = { fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
                           stroke: '#000000', strokeThickness: 3, backgroundColor: '#336633',
                           padding: { x: 20, y: 10 } };
        const btn = this.add.text(cx, cy + 40, 'Play Again', btnStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(5001).setInteractive();

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#44aa44' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#336633' }));
        btn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
