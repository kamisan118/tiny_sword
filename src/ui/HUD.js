import { GAME_WIDTH } from '../config/gameConfig.js';

export default class HUD {
    constructor(scene, eventBus) {
        this.scene = scene;
        this.eventBus = eventBus;

        const style = { fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
                        stroke: '#000000', strokeThickness: 3 };

        // Gold display (top-left)
        this.goldIcon = scene.add.image(40, 24, 'gold_icon').setScale(0.25).setScrollFactor(0).setDepth(1000);
        this.goldText = scene.add.text(60, 14, 'Gold: 100', style).setScrollFactor(0).setDepth(1000);

        // Wave display (top-center)
        this.waveText = scene.add.text(GAME_WIDTH / 2, 14, 'Wave 0', style)
            .setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

        // Timer display (top-right)
        this.timerText = scene.add.text(GAME_WIDTH - 20, 14, 'Next wave: 60s', style)
            .setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        // Listen for gold changes
        eventBus.on('goldChanged', (gold) => {
            this.goldText.setText(`Gold: ${gold}`);
        });

        // Listen for wave changes
        eventBus.on('waveChanged', (wave) => {
            this.waveText.setText(`Wave ${wave}`);
        });
    }

    updateTimer(seconds) {
        if (seconds <= 0) {
            this.timerText.setText('Wave incoming!');
        } else {
            this.timerText.setText(`Next wave: ${Math.ceil(seconds)}s`);
        }
    }

    showVictory() {
        this.timerText.setText('VICTORY!');
    }

    showDefeat() {
        this.timerText.setText('DEFEATED');
    }
}
