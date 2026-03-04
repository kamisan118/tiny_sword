import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/gameConfig.js';
import { t, getLocale, setLocale } from '../i18n/i18n.js';

export default class LandingScene extends Phaser.Scene {
    constructor() {
        super('LandingScene');
    }

    create() {
        const cx = VIEWPORT_WIDTH / 2;
        const cy = VIEWPORT_HEIGHT / 2;

        // Full-screen background
        const bg = this.add.image(cx, cy, 'landing_bg');
        bg.setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        // --- Language toggle button (top-left) ---
        const langBtn = this.add.image(40, 40, 'ui_btn_sq_blue')
            .setDisplaySize(50, 50).setInteractive();
        const langLabel = getLocale() === 'en' ? 'EN' : '中';
        const langText = this.add.text(40, 40, langLabel, {
            fontSize: '18px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        langBtn.on('pointerover', () => langBtn.setTexture('ui_btn_sq_hover'));
        langBtn.on('pointerout', () => langBtn.setTexture('ui_btn_sq_blue'));
        langBtn.on('pointerdown', () => {
            langBtn.setTexture('ui_btn_sq_pressed');
            const newLocale = getLocale() === 'en' ? 'zh' : 'en';
            setLocale(newLocale);
            this.scene.restart();
        });

        // --- Start Game button ---
        const startBtnY = cy + 120;
        const startBtn = this.add.image(cx, startBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        this.add.text(cx, startBtnY - 2, t('startGame'), {
            fontSize: '22px', color: '#fef3c0', fontFamily: 'Arial',
            stroke: '#3a2a14', strokeThickness: 3
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setTexture('ui_btn_hover'));
        startBtn.on('pointerout', () => startBtn.setTexture('ui_btn_blue'));
        startBtn.on('pointerdown', () => {
            startBtn.setTexture('ui_btn_blue_pressed');
            this.scene.start('GameScene');
            this.scene.stop();
        });

        // --- Quit button ---
        const quitBtnY = startBtnY + 60;
        const quitBtn = this.add.image(cx, quitBtnY, 'ui_btn_blue')
            .setScale(1.2, 0.9).setInteractive();
        this.add.text(cx, quitBtnY - 2, t('quit'), {
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
