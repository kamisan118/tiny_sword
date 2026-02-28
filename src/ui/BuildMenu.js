import { TILE_SIZE, BARRACKS_COST, GOLDMINE_COST, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class BuildMenu {
    constructor(scene, castle) {
        this.scene = scene;
        this.castle = castle;
        this.panelOpen = false;
        this.panelElements = [];
        this.canAffordMine = true;
        this.canAffordBarracks = true;

        // Build button at the top of the castle
        const center = castle.getCenter();
        this.btnX = center.x;
        this.btnY = center.y - (castle.gridH * TILE_SIZE) / 2 + 16;

        const style = { fontSize: '14px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Hammer icon to the left of the button
        this.hammerIcon = scene.add.image(this.btnX - 60, this.btnY, 'ui_icon_hammer')
            .setScale(0.4).setDepth(901);

        this.buildBtn = scene.add.image(this.btnX, this.btnY, 'ui_btn_blue')
            .setScale(0.9, 0.8).setDepth(900).setInteractive();
        this.buildLabel = scene.add.text(this.btnX, this.btnY - 1, 'Build', style)
            .setOrigin(0.5).setDepth(901);

        this.buildBtn.on('pointerover', () => this.buildBtn.setTexture('ui_btn_hover'));
        this.buildBtn.on('pointerout', () => this.buildBtn.setTexture('ui_btn_blue'));
        this.buildBtn.on('pointerdown', () => {
            if (this.panelOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        // Listen for gold changes
        scene.eventBus.on('goldChanged', (gold) => this.updateAffordState(gold));
        this.updateAffordState(scene.resourceSystem.getGold());
    }

    openPanel() {
        if (this.panelOpen) return;
        this.panelOpen = true;

        const scene = this.scene;
        const panelX = this.btnX;
        const panelY = this.btnY;

        const style = { fontSize: '13px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Click-outside-to-close backdrop
        this.backdrop = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setDepth(949).setInteractive();
        this.backdrop.on('pointerdown', () => this.closePanel());

        // Panel background — vertical layout, 2 items stacked
        const pw = 170, rowH = 45, rows = 2;
        const ph = rowH * rows + 20;
        this.panelBg = scene.add.rectangle(panelX, panelY, pw, ph, 0x3a2a14, 0.85)
            .setDepth(950).setStrokeStyle(2, 0xfef3c0);

        // Row positions (centered vertically in the panel)
        const row1Y = panelY - rowH / 2;
        const row2Y = panelY + rowH / 2;

        // --- Row 1: Gold Mine ---
        const mineIcon = scene.add.image(panelX - 55, row1Y, 'goldmine_active')
            .setScale(0.16).setDepth(952);
        const mineBtn = scene.add.image(panelX + 15, row1Y, 'ui_btn_blue')
            .setScale(0.75, 0.65).setDepth(951).setInteractive();
        const mineLabel = scene.add.text(panelX + 15, row1Y - 8, 'Gold Mine', style)
            .setOrigin(0.5).setDepth(952);
        const mineCost = scene.add.text(panelX + 15, row1Y + 8, `${GOLDMINE_COST}g`, { ...style, color: '#ffdd44' })
            .setOrigin(0.5).setDepth(952);

        this._setupItemButton(mineBtn, 'goldmine', () => this.canAffordMine);
        if (!this.canAffordMine) {
            mineBtn.setTexture('ui_btn_disable');
            mineIcon.setAlpha(0.5);
            mineCost.setColor('#aa6666');
        }

        // --- Row 2: Barracks ---
        const brrIcon = scene.add.image(panelX - 55, row2Y, 'barracks')
            .setScale(0.19).setDepth(952);
        const brrBtn = scene.add.image(panelX + 15, row2Y, 'ui_btn_blue')
            .setScale(0.75, 0.65).setDepth(951).setInteractive();
        const brrLabel = scene.add.text(panelX + 15, row2Y - 8, 'Barracks', style)
            .setOrigin(0.5).setDepth(952);
        const brrCost = scene.add.text(panelX + 15, row2Y + 8, `${BARRACKS_COST}g`, { ...style, color: '#ffdd44' })
            .setOrigin(0.5).setDepth(952);

        this._setupItemButton(brrBtn, 'barracks', () => this.canAffordBarracks);
        if (!this.canAffordBarracks) {
            brrBtn.setTexture('ui_btn_disable');
            brrIcon.setAlpha(0.5);
            brrCost.setColor('#aa6666');
        }

        this.panelElements = [this.backdrop, this.panelBg,
            mineIcon, mineBtn, mineLabel, mineCost,
            brrIcon, brrBtn, brrLabel, brrCost];
    }

    closePanel() {
        for (const el of this.panelElements) {
            el.destroy();
        }
        this.panelElements = [];
        this.panelOpen = false;
    }

    _setupItemButton(btn, buildType, canAffordFn) {
        btn.on('pointerover', () => {
            if (canAffordFn()) btn.setTexture('ui_btn_hover');
        });
        btn.on('pointerout', () => {
            btn.setTexture(canAffordFn() ? 'ui_btn_blue' : 'ui_btn_disable');
        });
        btn.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            if (!canAffordFn()) return;
            if (this.scene.buildSystem.active) return;
            this.scene.buildSystem.enterBuildMode(buildType);
            this.closePanel();
        });
    }

    updateAffordState(gold) {
        this.canAffordMine = gold >= GOLDMINE_COST;
        this.canAffordBarracks = gold >= BARRACKS_COST;
    }
}
