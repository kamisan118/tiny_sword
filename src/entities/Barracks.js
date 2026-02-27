import Building from './Building.js';
import { BARRACKS_HP, BARRACKS_COST, WARRIOR_PRODUCE_TIME } from '../config/gameConfig.js';
import Warrior from './Warrior.js';

export default class Barracks extends Building {
    constructor(scene, gridSystem, gx, gy) {
        super(scene, gridSystem, gx, gy, 3, 4, 'barracks', BARRACKS_HP);
        this.type = 'barracks';
        this.faction = 'player';
        this.produceTimer = 0;
    }

    static get cost() { return BARRACKS_COST; }

    update(time, delta) {
        if (!this.alive) return;

        this.produceTimer += delta;
        if (this.produceTimer >= WARRIOR_PRODUCE_TIME) {
            this.produceTimer -= WARRIOR_PRODUCE_TIME;
            this.spawnWarrior();
        }
    }

    spawnWarrior() {
        const cell = this.scene.gridSystem.findAdjacentFreeCell(
            this.gx, this.gy, this.gridW, this.gridH
        );
        if (cell) {
            const warrior = new Warrior(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
            this.scene.playerUnits.push(warrior);
        }
    }

    getProduceProgress() {
        return this.produceTimer / WARRIOR_PRODUCE_TIME;
    }
}
