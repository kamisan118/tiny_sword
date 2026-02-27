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
        // Full-screen 9-slice SpecialPaper background (replaces water)
        // Define custom frames from exact pixel positions in the spritesheet
        const tex = this.textures.get('ui_special_paper');
        tex.add('sp_tl', 0, 10, 21, 54, 43);
        tex.add('sp_t',  0, 128, 21, 64, 43);
        tex.add('sp_tr', 0, 256, 21, 54, 43);
        tex.add('sp_l',  0, 10, 128, 54, 64);
        tex.add('sp_c',  0, 128, 128, 64, 64);
        tex.add('sp_r',  0, 256, 128, 54, 64);
        tex.add('sp_bl', 0, 10, 256, 54, 43);
        tex.add('sp_b',  0, 128, 256, 64, 43);
        tex.add('sp_br', 0, 256, 256, 55, 43);

        const cs = 64; // corner display size
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        const add9 = (x, y, frame, dw, dh) =>
            this.add.image(x, y, 'ui_special_paper', frame)
                .setDisplaySize(dw, dh).setDepth(-1);

        add9(w / 2, h / 2, 'sp_c', w - 2 * cs, h - 2 * cs);       // center
        add9(w / 2, cs / 2, 'sp_t', w - 2 * cs, cs);               // top
        add9(w / 2, h - cs / 2, 'sp_b', w - 2 * cs, cs);           // bottom
        add9(cs / 2, h / 2, 'sp_l', cs, h - 2 * cs);               // left
        add9(w - cs / 2, h / 2, 'sp_r', cs, h - 2 * cs);           // right
        add9(cs / 2, cs / 2, 'sp_tl', cs, cs);                      // TL
        add9(w - cs / 2, cs / 2, 'sp_tr', cs, cs);                  // TR
        add9(cs / 2, h - cs / 2, 'sp_bl', cs, cs);                  // BL
        add9(w - cs / 2, h - cs / 2, 'sp_br', cs, cs);              // BR

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

        // 9-slice RegularPaper panel
        this._createRegularPaperPanel(cx, cy, 400, 250);

        // Result text
        const titleStyle = { fontSize: '52px', color: result === 'victory' ? '#ffdd44' : '#ff4444',
                             fontFamily: 'Arial', stroke: '#000000', strokeThickness: 6 };
        const title = result === 'victory' ? 'VICTORY' : 'DEFEAT';
        this.add.text(cx, cy - 50, title, titleStyle)
            .setOrigin(0.5).setScrollFactor(0).setDepth(5002);

        // Play Again button using game UI assets
        const btnImg = this.add.image(cx, cy + 40, 'ui_btn_blue')
            .setScale(1.2, 0.9).setScrollFactor(0).setDepth(5002).setInteractive();
        const btnLabel = this.add.text(cx, cy + 38, 'Play Again', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5003);

        btnImg.on('pointerover', () => btnImg.setTexture('ui_btn_hover'));
        btnImg.on('pointerout', () => btnImg.setTexture('ui_btn_blue'));
        btnImg.on('pointerdown', () => {
            btnImg.setTexture('ui_btn_blue_pressed');
            this.scene.restart();
        });
    }

    _createRegularPaperPanel(cx, cy, w, h) {
        // Define custom frames (exact pixel positions from RegularPaper.png)
        const tex = this.textures.get('ui_regular_paper');
        if (!tex.has('rp_tl')) {
            tex.add('rp_tl', 0, 12, 20, 52, 44);
            tex.add('rp_t',  0, 128, 20, 64, 44);
            tex.add('rp_tr', 0, 256, 20, 52, 44);
            tex.add('rp_l',  0, 12, 128, 52, 64);
            tex.add('rp_c',  0, 128, 128, 64, 64);
            tex.add('rp_r',  0, 256, 128, 52, 64);
            tex.add('rp_bl', 0, 12, 256, 52, 45);
            tex.add('rp_b',  0, 128, 256, 64, 43);
            tex.add('rp_br', 0, 256, 256, 52, 45);
        }

        const cs = 52;
        const dep = 5001;
        const x1 = cx - w / 2, x2 = cx + w / 2;
        const y1 = cy - h / 2, y2 = cy + h / 2;

        // Solid fill behind 9-slice to prevent dark overlay bleeding through
        this.add.rectangle(cx, cy, w - 20, h - 20, 0xeee1c6)
            .setScrollFactor(0).setDepth(dep);

        const add9 = (x, y, frame, dw, dh) =>
            this.add.image(x, y, 'ui_regular_paper', frame)
                .setDisplaySize(dw, dh).setScrollFactor(0).setDepth(dep + 0.1);

        add9(cx, cy, 'rp_c', w - 2 * cs, h - 2 * cs);
        add9(cx, y1 + cs / 2, 'rp_t', w - 2 * cs, cs);
        add9(cx, y2 - cs / 2, 'rp_b', w - 2 * cs, cs);
        add9(x1 + cs / 2, cy, 'rp_l', cs, h - 2 * cs);
        add9(x2 - cs / 2, cy, 'rp_r', cs, h - 2 * cs);
        add9(x1 + cs / 2, y1 + cs / 2, 'rp_tl', cs, cs);
        add9(x2 - cs / 2, y1 + cs / 2, 'rp_tr', cs, cs);
        add9(x1 + cs / 2, y2 - cs / 2, 'rp_bl', cs, cs);
        add9(x2 - cs / 2, y2 - cs / 2, 'rp_br', cs, cs);
    }
}
