import Building from './Building.js';
import Warrior from './Warrior.js';
import { BARRACKS_HP, BARRACKS_COST, WARRIOR_COST, WARRIOR_PRODUCE_TIME, TILE_SIZE } from '../config/gameConfig.js';

export default class Barracks extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 4, 'barracks', BARRACKS_HP);
        this.type = 'barracks';
        this.faction = 'player';
        this.producing = false;
        this.produceTimer = 0;
        this.produceCallback = null;
        this.uiElements = [];

        this.createUI();
    }

    static get cost() { return BARRACKS_COST; }

    createUI() {
        const center = this.getCenter();
        const btnY = center.y - (this.gridH * TILE_SIZE) / 2 + 16;

        const style = { fontSize: '12px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Button
        this.btnImage = this.scene.add.image(center.x, btnY, 'ui_btn_blue').setScale(0.7, 0.6)
            .setDepth(2000).setInteractive();
        this.uiElements.push(this.btnImage);

        // Label
        this.btnLabel = this.scene.add.text(center.x, btnY, `Train (${WARRIOR_COST}g)`, style)
            .setOrigin(0.5).setDepth(2001);
        this.uiElements.push(this.btnLabel);

        // Progress bar base (BigBar 320×64)
        this.barBase = this.scene.add.image(center.x, btnY + 22, 'ui_bigbar_base').setScale(0.4, 0.35)
            .setDepth(2000);
        this.uiElements.push(this.barBase);

        // Progress bar fill (BigBar_Fill 64×64, uses setCrop)
        this.progressFill = this.scene.add.image(center.x - 44, btnY + 22, 'ui_bigbar_fill')
            .setOrigin(0, 0.5).setDisplaySize(88, 14).setDepth(2001);
        this.progressFill.setCrop(0, 0, 0, 64);
        this.uiElements.push(this.progressFill);

        this.canAfford = true;

        // Button interaction
        this.btnImage.on('pointerover', () => {
            if (this.canAfford && !this.producing) this.btnImage.setTexture('ui_btn_hover');
        });
        this.btnImage.on('pointerout', () => {
            this._updateBtnTexture();
        });
        this.btnImage.on('pointerdown', () => {
            if (!this.canAfford || this.producing) return;
            this.btnImage.setTexture('ui_btn_blue_pressed');
            this._startProduction();
        });
        this.btnImage.on('pointerup', () => {
            this._updateBtnTexture();
        });
    }

    _startProduction() {
        if (!this.scene.resourceSystem.spendGold(WARRIOR_COST)) return;
        this.produceUnit(() => {
            const cell = this.scene.gridSystem.findAdjacentFreeCell(
                this.gx, this.gy, this.gridW, this.gridH
            );
            if (cell) {
                const warrior = new Warrior(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                this.scene.playerUnits.push(warrior);
            }
        });
    }

    _updateBtnTexture() {
        if (!this.btnImage) return;
        if (this.producing) {
            this.btnImage.setTexture('ui_btn_disable');
        } else {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        }
    }

    produceUnit(callback) {
        if (this.producing) return false;
        this.producing = true;
        this.produceTimer = 0;
        this.produceCallback = callback;
        this._updateBtnTexture();
        return true;
    }

    update(time, delta) {
        // Update afford state
        if (this.scene.resourceSystem) {
            this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST;
            this._updateBtnTexture();
        }

        if (!this.producing) {
            if (this.progressFill) this.progressFill.setCrop(0, 0, 0, 64);
            return;
        }

        this.produceTimer += delta;

        // Update progress bar
        if (this.progressFill) {
            const progress = this.produceTimer / WARRIOR_PRODUCE_TIME;
            this.progressFill.setCrop(0, 0, Math.floor(64 * progress), 64);
        }

        if (this.produceTimer >= WARRIOR_PRODUCE_TIME) {
            this.producing = false;
            this.produceTimer = 0;
            if (this.produceCallback) {
                this.produceCallback();
                this.produceCallback = null;
            }
            this._updateBtnTexture();
        }
    }

    getProduceProgress() {
        if (!this.producing) return 0;
        return this.produceTimer / WARRIOR_PRODUCE_TIME;
    }

    onDestroyed() {
        for (const el of this.uiElements) {
            el.destroy();
        }
        this.uiElements = [];
        this.btnImage = null;
        this.progressFill = null;
        this.barBase = null;
        super.onDestroyed();
    }
}
