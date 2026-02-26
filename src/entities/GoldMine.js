import Building from './Building.js';
import { GOLDMINE_CAPACITY } from '../config/gameConfig.js';

export default class GoldMine extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 2, 'goldmine_active', 9999);
        this.type = 'goldmine';
        this.faction = 'neutral';
        this.goldRemaining = GOLDMINE_CAPACITY;
    }

    harvest(amount) {
        const actual = Math.min(amount, this.goldRemaining);
        this.goldRemaining -= actual;
        if (this.goldRemaining <= 0) {
            this.deplete();
        }
        return actual;
    }

    deplete() {
        this.sprite.setTexture('goldmine_inactive');
    }
}
