import { spritesheets, images } from '../config/assetManifest.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Progress bar
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const barW = 400;
        const barH = 30;

        const bg = this.add.rectangle(cx, cy, barW, barH, 0x222222);
        const fill = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x44aa44);
        fill.setOrigin(0, 0.5);

        const label = this.add.text(cx, cy - 40, 'Loading...', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            fill.width = barW * value;
            label.setText(`Loading... ${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            bg.destroy();
            fill.destroy();
            label.destroy();
        });

        // Load all spritesheets
        for (const s of spritesheets) {
            this.load.spritesheet(s.key, s.path, {
                frameWidth: s.frameWidth,
                frameHeight: s.frameHeight
            });
        }

        // Load all images
        for (const img of images) {
            this.load.image(img.key, img.path);
        }
    }

    create() {
        console.log('Boot OK — all assets loaded');
        this.scene.start('GameScene');
    }
}
