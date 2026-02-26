import { GAME_WIDTH, GAME_HEIGHT, BARRACKS_COST } from '../config/gameConfig.js';

export default class BuildMenu {
    constructor(scene) {
        this.scene = scene;

        // Bottom panel background
        const panelY = GAME_HEIGHT - 50;
        this.panel = scene.add.rectangle(GAME_WIDTH / 2, panelY, 300, 60, 0x000000, 0.6)
            .setScrollFactor(0).setDepth(900);

        // Barracks button
        const btnX = GAME_WIDTH / 2;
        this.barracksBtn = scene.add.image(btnX - 40, panelY, 'barracks')
            .setScale(0.2).setScrollFactor(0).setDepth(901).setInteractive();

        const style = { fontSize: '14px', color: '#ffffff', fontFamily: 'Arial',
                        stroke: '#000000', strokeThickness: 2 };
        this.barracksLabel = scene.add.text(btnX + 10, panelY - 10, `Barracks`, style)
            .setScrollFactor(0).setDepth(901);
        this.barracksCost = scene.add.text(btnX + 10, panelY + 6, `${BARRACKS_COST} gold`, { ...style, fontSize: '12px', color: '#ffdd44' })
            .setScrollFactor(0).setDepth(901);

        // Click handler
        this.barracksBtn.on('pointerdown', () => {
            if (scene.buildSystem.active) return;
            scene.buildSystem.enterBuildMode('barracks');
        });

        // Update button tint based on gold
        scene.eventBus.on('goldChanged', (gold) => {
            this.updateButtonState(gold);
        });

        this.updateButtonState(scene.resourceSystem.getGold());
    }

    updateButtonState(gold) {
        if (gold >= BARRACKS_COST) {
            this.barracksBtn.clearTint();
            this.barracksBtn.setAlpha(1);
        } else {
            this.barracksBtn.setTint(0x666666);
            this.barracksBtn.setAlpha(0.5);
        }
    }
}
