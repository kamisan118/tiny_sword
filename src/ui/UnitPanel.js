import { GAME_WIDTH, GAME_HEIGHT, WARRIOR_COST } from '../config/gameConfig.js';

export default class UnitPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.visible = false;
        this.canAfford = true;

        // Listen for selection changes
        this.scene.events.on('update', () => this.refresh());
    }

    refresh() {
        const sel = this.scene.selectionSystem;
        if (!sel) return;

        const selectedBuilding = sel.selectedBuilding;

        // Only show for barracks
        if (selectedBuilding && selectedBuilding.type === 'barracks' && selectedBuilding.alive) {
            if (!this.visible) this.show(selectedBuilding);
            this.updateProgress(selectedBuilding);
        } else {
            if (this.visible) this.hide();
        }
    }

    show(barracks) {
        this.visible = true;
        this.clear();

        const panelX = GAME_WIDTH / 2 + 200;
        const panelY = GAME_HEIGHT - 55;

        const style = { fontSize: '14px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Panel background
        const bg = this.scene.add.image(panelX, panelY, 'ui_banner_h').setScale(1.56, 0.52)
            .setScrollFactor(0).setDepth(899);
        this.elements.push(bg);

        // Sword icon
        const icon = this.scene.add.image(panelX - 85, panelY - 12, 'ui_icon_sword').setScale(0.5)
            .setScrollFactor(0).setDepth(901);
        this.elements.push(icon);

        // Button image
        this.btnImage = this.scene.add.image(panelX + 15, panelY - 12, 'ui_btn_blue').setScale(0.75)
            .setScrollFactor(0).setDepth(900).setInteractive();
        this.elements.push(this.btnImage);

        // Button label
        const label = this.scene.add.text(panelX + 15, panelY - 12, `Train Warrior (${WARRIOR_COST}g)`, style)
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);
        this.elements.push(label);

        // Button interaction
        this.btnImage.on('pointerover', () => {
            if (this.canAfford) this.btnImage.setTexture('ui_btn_hover');
        });

        this.btnImage.on('pointerout', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        this.btnImage.on('pointerdown', () => {
            if (!this.canAfford) return;
            this.btnImage.setTexture('ui_btn_blue_pressed');
            if (!this.scene.resourceSystem.spendGold(WARRIOR_COST)) return;
            barracks.produceUnit(() => {
                const cell = this.scene.gridSystem.findAdjacentFreeCell(
                    barracks.gx, barracks.gy, barracks.gridW, barracks.gridH
                );
                if (cell) {
                    const Warrior = this._getWarriorClass();
                    if (Warrior) {
                        const warrior = new Warrior(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                        this.scene.playerUnits.push(warrior);
                    }
                }
            });
        });

        this.btnImage.on('pointerup', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        // Progress bar base
        this.barBase = this.scene.add.image(panelX, panelY + 25, 'ui_bar_base').setScale(0.55, 0.45)
            .setScrollFactor(0).setDepth(900);
        this.elements.push(this.barBase);

        // Progress bar fill
        this.progressFill = this.scene.add.image(panelX - 80, panelY + 25, 'ui_bar_fill')
            .setOrigin(0, 0.5).setDisplaySize(160, 22)
            .setScrollFactor(0).setDepth(901);
        this.progressFill.setCrop(0, 0, 0, 64);
        this.elements.push(this.progressFill);

        // Update afford state
        this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST;

        this.barracksRef = barracks;
    }

    updateProgress(barracks) {
        if (!this.progressFill) return;
        const progress = barracks.getProduceProgress();
        this.progressFill.setCrop(0, 0, Math.floor(64 * progress), 64);

        // Update afford state
        this.canAfford = this.scene.resourceSystem.getGold() >= WARRIOR_COST;
        if (this.btnImage) {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        }
    }

    hide() {
        this.visible = false;
        this.clear();
    }

    clear() {
        for (const el of this.elements) {
            el.destroy();
        }
        this.elements = [];
        this.progressFill = null;
        this.barBase = null;
        this.btnImage = null;
        this.barracksRef = null;
    }

    // Lazy import to avoid circular deps
    _getWarriorClass() {
        if (!this._WarriorClass) {
            // Set by GameScene after import
            this._WarriorClass = this.scene._WarriorClass;
        }
        return this._WarriorClass;
    }
}
