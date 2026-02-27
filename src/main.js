import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#525B66',
    scene: [BootScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
window.game = game;
