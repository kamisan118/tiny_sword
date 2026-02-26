import { STARTING_GOLD } from '../config/gameConfig.js';

export default class ResourceSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.gold = STARTING_GOLD;
    }

    addGold(amount) {
        this.gold += amount;
        this.eventBus.emit('goldChanged', this.gold);
    }

    spendGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        this.eventBus.emit('goldChanged', this.gold);
        return true;
    }

    getGold() {
        return this.gold;
    }

    setGold(amount) {
        this.gold = amount;
        this.eventBus.emit('goldChanged', this.gold);
    }
}
