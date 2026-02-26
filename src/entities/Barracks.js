import Building from './Building.js';
import { BARRACKS_HP, BARRACKS_COST, WARRIOR_COST, WARRIOR_PRODUCE_TIME, TILE_SIZE } from '../config/gameConfig.js';

export default class Barracks extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 4, 'barracks', BARRACKS_HP);
        this.type = 'barracks';
        this.faction = 'player';
        this.producing = false;
        this.produceTimer = 0;
        this.produceCallback = null;
    }

    static get cost() { return BARRACKS_COST; }

    produceUnit(callback) {
        if (this.producing) return false;
        this.producing = true;
        this.produceTimer = 0;
        this.produceCallback = callback;
        return true;
    }

    update(time, delta) {
        if (!this.producing) return;
        this.produceTimer += delta;
        if (this.produceTimer >= WARRIOR_PRODUCE_TIME) {
            this.producing = false;
            this.produceTimer = 0;
            if (this.produceCallback) {
                this.produceCallback();
                this.produceCallback = null;
            }
        }
    }

    getProduceProgress() {
        if (!this.producing) return 0;
        return this.produceTimer / WARRIOR_PRODUCE_TIME;
    }
}
