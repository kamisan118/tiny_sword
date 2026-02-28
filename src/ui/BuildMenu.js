import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, BARRACKS_COST, GOLDMINE_COST } from '../config/gameConfig.js';

export default class BuildMenu {
    constructor(scene) {
        this.scene = scene;

        const panelX = VIEWPORT_WIDTH / 2;
        const panelY = VIEWPORT_HEIGHT - 25;

        const style = { fontSize: '14px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // --- Gold Mine button (left side) ---
        const mineX = panelX - 130;
        this.mineIcon = scene.add.image(mineX - 70, panelY, 'goldmine_active')
            .setScale(0.18).setScrollFactor(0).setDepth(901);
        this.mineBtn = scene.add.image(mineX + 30, panelY, 'ui_btn_blue').setScale(0.9, 0.85)
            .setScrollFactor(0).setDepth(900).setInteractive();
        this.mineLabel = scene.add.text(mineX + 30, panelY - 10, 'Gold Mine', style)
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);
        this.mineCostText = scene.add.text(mineX + 30, panelY + 8, `${GOLDMINE_COST} gold`, { ...style, color: '#ffdd44' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);

        this._setupButton(this.mineBtn, 'goldmine', () => this.canAffordMine);

        // --- Barracks button (right side) ---
        const brrX = panelX + 130;
        this.barracksIcon = scene.add.image(brrX - 70, panelY, 'barracks')
            .setScale(0.22).setScrollFactor(0).setDepth(901);
        this.barracksBtn = scene.add.image(brrX + 30, panelY, 'ui_btn_blue').setScale(0.9, 0.85)
            .setScrollFactor(0).setDepth(900).setInteractive();
        this.barracksLabel = scene.add.text(brrX + 30, panelY - 10, 'Barracks', style)
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);
        this.barracksCostText = scene.add.text(brrX + 30, panelY + 8, `${BARRACKS_COST} gold`, { ...style, color: '#ffdd44' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);

        this._setupButton(this.barracksBtn, 'barracks', () => this.canAffordBarracks);

        // Show all BuildMenu elements on bgCamera
        [this.mineIcon, this.mineBtn, this.mineLabel, this.mineCostText,
         this.barracksIcon, this.barracksBtn, this.barracksLabel, this.barracksCostText]
            .forEach(el => scene.showOnBgCamera(el));

        // Track afford states
        this.canAffordMine = true;
        this.canAffordBarracks = true;

        // Update button states based on gold
        scene.eventBus.on('goldChanged', (gold) => this.updateButtonState(gold));
        this.updateButtonState(scene.resourceSystem.getGold());
    }

    _setupButton(btn, buildType, canAffordFn) {
        btn.on('pointerover', () => {
            if (canAffordFn()) btn.setTexture('ui_btn_hover');
        });
        btn.on('pointerout', () => {
            btn.setTexture(canAffordFn() ? 'ui_btn_blue' : 'ui_btn_disable');
        });
        btn.on('pointerdown', () => {
            if (!canAffordFn()) return;
            if (this.scene.buildSystem.active) return;
            btn.setTexture('ui_btn_blue_pressed');
            this.scene.buildSystem.enterBuildMode(buildType);
        });
        btn.on('pointerup', () => {
            btn.setTexture(canAffordFn() ? 'ui_btn_blue' : 'ui_btn_disable');
        });
    }

    updateButtonState(gold) {
        // Gold Mine
        this.canAffordMine = gold >= GOLDMINE_COST;
        this.mineBtn.setTexture(this.canAffordMine ? 'ui_btn_blue' : 'ui_btn_disable');
        this.mineIcon.setAlpha(this.canAffordMine ? 1 : 0.5);
        this.mineCostText.setColor(this.canAffordMine ? '#ffdd44' : '#aa6666');

        // Barracks
        this.canAffordBarracks = gold >= BARRACKS_COST;
        this.barracksBtn.setTexture(this.canAffordBarracks ? 'ui_btn_blue' : 'ui_btn_disable');
        this.barracksIcon.setAlpha(this.canAffordBarracks ? 1 : 0.5);
        this.barracksCostText.setColor(this.canAffordBarracks ? '#ffdd44' : '#aa6666');
    }
}
