import { GAME_WIDTH, GAME_HEIGHT, BARRACKS_COST } from '../config/gameConfig.js';

export default class BuildMenu {
    constructor(scene) {
        this.scene = scene;

        const panelX = 640;
        const panelY = GAME_HEIGHT - 55;

        const style = { fontSize: '14px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Panel background
        this.panelBg = scene.add.image(panelX, panelY, 'ui_banner_h').setScale(1.82, 0.47)
            .setScrollFactor(0).setDepth(899);

        // Barracks icon
        this.barracksIcon = scene.add.image(panelX - 100, panelY, 'barracks')
            .setScale(0.22).setScrollFactor(0).setDepth(901);

        // Button image
        this.btnImage = scene.add.image(panelX + 30, panelY, 'ui_btn_blue').setScale(0.9, 0.85)
            .setScrollFactor(0).setDepth(900).setInteractive();

        // Button label
        this.barracksLabel = scene.add.text(panelX + 30, panelY - 10, 'Barracks', style)
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);

        // Cost label
        this.barracksCost = scene.add.text(panelX + 30, panelY + 8, `${BARRACKS_COST} gold`, { ...style, color: '#ffdd44' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(901);

        // Track afford state
        this.canAfford = true;

        // Button interaction
        this.btnImage.on('pointerover', () => {
            if (this.canAfford) this.btnImage.setTexture('ui_btn_hover');
        });

        this.btnImage.on('pointerout', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        this.btnImage.on('pointerdown', () => {
            if (!this.canAfford) return;
            if (scene.buildSystem.active) return;
            this.btnImage.setTexture('ui_btn_blue_pressed');
            scene.buildSystem.enterBuildMode('barracks');
        });

        this.btnImage.on('pointerup', () => {
            this.btnImage.setTexture(this.canAfford ? 'ui_btn_blue' : 'ui_btn_disable');
        });

        // Update button state based on gold
        scene.eventBus.on('goldChanged', (gold) => {
            this.updateButtonState(gold);
        });

        this.updateButtonState(scene.resourceSystem.getGold());
    }

    updateButtonState(gold) {
        this.canAfford = gold >= BARRACKS_COST;
        if (this.canAfford) {
            this.btnImage.setTexture('ui_btn_blue');
            this.barracksIcon.setAlpha(1);
            this.barracksCost.setColor('#ffdd44');
        } else {
            this.btnImage.setTexture('ui_btn_disable');
            this.barracksIcon.setAlpha(0.5);
            this.barracksCost.setColor('#aa6666');
        }
    }
}
