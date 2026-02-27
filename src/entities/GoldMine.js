import Building from './Building.js';
import { GOLDMINE_COST, GOLDMINE_HP, GOLDMINE_INCOME, GOLDMINE_INCOME_INTERVAL } from '../config/gameConfig.js';

export default class GoldMine extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 2, 'goldmine_active', GOLDMINE_HP);
        this.type = 'goldmine';
        this.faction = 'player';
        this.incomeTimer = 0;
    }

    static get cost() { return GOLDMINE_COST; }

    update(time, delta) {
        if (!this.alive) return;
        this.incomeTimer += delta;
        if (this.incomeTimer >= GOLDMINE_INCOME_INTERVAL) {
            this.incomeTimer -= GOLDMINE_INCOME_INTERVAL;
            this.scene.resourceSystem.addGold(GOLDMINE_INCOME);
        }
    }
}
