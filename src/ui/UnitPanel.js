import { GAME_WIDTH, GAME_HEIGHT, WARRIOR_COST } from '../config/gameConfig.js';

export default class UnitPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.visible = false;

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
        const panelY = GAME_HEIGHT - 50;

        // Panel bg
        const bg = this.scene.add.rectangle(panelX, panelY, 250, 60, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(900);
        this.elements.push(bg);

        const style = { fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
                        stroke: '#000000', strokeThickness: 2 };

        // Train warrior button
        const btn = this.scene.add.text(panelX - 100, panelY - 15, `Train Warrior (${WARRIOR_COST}g)`, style)
            .setScrollFactor(0).setDepth(901).setInteractive();
        this.elements.push(btn);

        btn.on('pointerdown', () => {
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

        // Progress bar
        this.progressBg = this.scene.add.rectangle(panelX, panelY + 15, 200, 10, 0x333333)
            .setScrollFactor(0).setDepth(901);
        this.elements.push(this.progressBg);

        this.progressFill = this.scene.add.rectangle(panelX - 100, panelY + 15, 0, 10, 0x44cc44)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(902);
        this.elements.push(this.progressFill);

        this.barracksRef = barracks;
    }

    updateProgress(barracks) {
        if (!this.progressFill) return;
        const progress = barracks.getProduceProgress();
        this.progressFill.width = 200 * progress;
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
        this.progressBg = null;
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
