import Warrior from '../entities/Warrior.js';
import GoblinTorch from '../entities/GoblinTorch.js';
import GoblinBarrel from '../entities/GoblinBarrel.js';
import GoblinTNT from '../entities/GoblinTNT.js';
import Barracks from '../entities/Barracks.js';
import GoldMine from '../entities/GoldMine.js';
import { WARRIOR_COST } from '../config/gameConfig.js';

export default class GameAPI {
    constructor(scene) {
        this.scene = scene;
    }

    // --- State Queries ---

    getGameState() {
        const s = this.scene;
        return {
            gold: s.resourceSystem.getGold(),
            gameOver: s.gameOver,
            gameResult: s.gameResult,
            wave: {
                current: s.waveSystem.currentWave,
                max: s.waveSystem.maxWaves,
                allSpawned: s.waveSystem.allWavesSpawned
            },
            playerUnits: s.playerUnits.filter(u => u.alive).map(u => this._serializeUnit(u)),
            enemyUnits: s.enemyUnits.filter(u => u.alive).map(u => this._serializeUnit(u)),
            buildings: s.buildings.filter(b => b.alive).map(b => this._serializeBuilding(b))
        };
    }

    _serializeUnit(u) {
        return {
            id: u.id,
            type: u.type,
            faction: u.faction,
            hp: u.hp,
            maxHp: u.maxHp,
            alive: u.alive,
            state: u.state,
            x: u.sprite ? u.sprite.x : 0,
            y: u.sprite ? u.sprite.y : 0
        };
    }

    _serializeBuilding(b) {
        return {
            id: b.id,
            type: b.type,
            faction: b.faction,
            hp: b.hp,
            maxHp: b.maxHp,
            alive: b.alive,
            gridX: b.gridX,
            gridY: b.gridY,
            producing: b.producing || false,
            produceProgress: b.getProduceProgress ? b.getProduceProgress() : 0
        };
    }

    // --- Unit Commands ---

    selectUnit(unitId) {
        const unit = this._findUnit(unitId);
        if (!unit) return false;
        this.scene.selectionSystem.deselectAll();
        unit.setSelected(true);
        this.scene.selectionSystem.selectedUnits = [unit];
        return true;
    }

    commandMove(unitId, gx, gy) {
        const unit = this._findUnit(unitId);
        if (!unit || !unit.alive) return false;
        const pos = this.scene.gridSystem.gridToPixel(gx, gy);
        unit.moveToWithPathfinding(pos.x, pos.y);
        return true;
    }

    commandAttack(unitId, targetId) {
        const unit = this._findUnit(unitId);
        if (!unit || !unit.alive) return false;
        const target = this._findUnit(targetId) || this.scene.buildings.find(b => b.id === targetId);
        if (!target || !target.alive) return false;
        unit.attackTarget = target;
        return true;
    }

    // --- Building ---

    buildStructure(type, gx, gy) {
        const bs = this.scene.buildSystem;
        const configs = {
            barracks: { w: 3, h: 4, cls: Barracks },
            goldmine: { w: 3, h: 2, cls: GoldMine },
        };
        const cfg = configs[type];
        if (!cfg) return { success: false, reason: 'unknown_type' };

        bs.gridW = cfg.w;
        bs.gridH = cfg.h;
        bs.buildingType = type;
        if (!bs.canPlaceAt(gx, gy)) return { success: false, reason: 'invalid_placement' };
        if (!this.scene.resourceSystem.spendGold(cfg.cls.cost)) return { success: false, reason: 'insufficient_gold' };
        const building = new cfg.cls(this.scene, this.scene.gridSystem, gx, gy);
        this.scene.buildings.push(building);
        return { success: true, buildingId: building.id };
    }

    produceUnit(buildingId, unitType) {
        const building = this.scene.buildings.find(b => b.id === buildingId && b.alive);
        if (!building) return { success: false, reason: 'building_not_found' };

        if (building.type === 'barracks' && unitType === 'warrior') {
            if (!this.scene.resourceSystem.spendGold(WARRIOR_COST)) {
                return { success: false, reason: 'insufficient_gold' };
            }
            const started = building.produceUnit(() => {
                const cell = this.scene.gridSystem.findAdjacentFreeCell(
                    building.gx, building.gy, building.gridW, building.gridH
                );
                if (cell) {
                    const warrior = new Warrior(this.scene, this.scene.gridSystem, cell.gx, cell.gy);
                    this.scene.playerUnits.push(warrior);
                }
            });
            if (!started) return { success: false, reason: 'already_producing' };
            return { success: true };
        }
        return { success: false, reason: 'unsupported' };
    }

    // --- Test Helpers ---

    setGold(amount) {
        const rs = this.scene.resourceSystem;
        const diff = amount - rs.getGold();
        if (diff > 0) rs.addGold(diff);
        else if (diff < 0) rs.spendGold(-diff);
        return rs.getGold();
    }

    skipToWave(n) {
        this.scene.waveSystem.skipToWave(n);
        return true;
    }

    spawnTestEnemy(type, gx, gy) {
        const enemy = this.scene.waveSystem.createEnemy(type, gx, gy);
        if (enemy) {
            this.scene.enemyUnits.push(enemy);
            return { success: true, unitId: enemy.id };
        }
        return { success: false, reason: 'unknown_type' };
    }

    // --- Internal ---

    _findUnit(unitId) {
        return this.scene.playerUnits.find(u => u.id === unitId) ||
               this.scene.enemyUnits.find(u => u.id === unitId);
    }
}
