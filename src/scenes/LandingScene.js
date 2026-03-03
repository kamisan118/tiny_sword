import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';

export default class LandingScene extends Phaser.Scene {
    constructor() {
        super('LandingScene');
    }

    create() {
        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;

        // Full-screen background (static first frame of GIF)
        const bg = this.add.image(cx, cy, 'landing_bg');
        bg.setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        // --- Start Game button ---
        const startBtnY = cy + 120;
        const startBtn = this.add.image(cx, startBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        const startText = this.add.text(cx, startBtnY - 2, 'Start Game', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setTexture('ui_btn_hover'));
        startBtn.on('pointerout', () => startBtn.setTexture('ui_btn_blue'));
        startBtn.on('pointerdown', () => {
            startBtn.setTexture('ui_btn_blue_pressed');
            this.scene.start('GameScene');
        });

        // --- Quit button ---
        const quitBtnY = startBtnY + 60;
        const quitBtn = this.add.image(cx, quitBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        const quitText = this.add.text(cx, quitBtnY - 2, 'Quit', {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        quitBtn.on('pointerover', () => quitBtn.setTexture('ui_btn_hover'));
        quitBtn.on('pointerout', () => quitBtn.setTexture('ui_btn_blue'));
        quitBtn.on('pointerdown', () => {
            quitBtn.setTexture('ui_btn_blue_pressed');
            window.close();
        });
    }
}
