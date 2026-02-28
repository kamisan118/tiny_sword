import { TILE_SIZE, GOLDMINE_COST, BARRACKS_COST, TOWER_COST, ARCHERY_COST, HOUSE_COST, MONASTERY_COST, GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

export default class BuildMenu {
    constructor(scene, castle) {
        this.scene = scene;
        this.castle = castle;
        this.panelOpen = false;
        this.panelElements = [];
        this.canAffordMine = true;
        this.canAffordBarracks = true;
        this.canAffordTower = true;
        this.canAffordArchery = true;
        this.canAffordHouse = true;
        this.canAffordMonastery = true;

        // Build button at the top of the castle
        const center = castle.getCenter();
        this.btnX = center.x;
        this.btnY = center.y - (castle.gridH * TILE_SIZE) / 2 + 16;

        const style = { fontSize: '14px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Hammer icon to the left of the button
        this.hammerIcon = scene.add.image(this.btnX - 60, this.btnY, 'ui_icon_hammer')
            .setScale(0.4).setDepth(901);

        this.buildBtn = scene.add.image(this.btnX, this.btnY, 'ui_btn_blue')
            .setScale(0.9, 0.8).setDepth(900).setInteractive();
        this.buildLabel = scene.add.text(this.btnX, this.btnY - 1, 'Build', style)
            .setOrigin(0.5).setDepth(901);

        this.buildBtn.on('pointerover', () => this.buildBtn.setTexture('ui_btn_hover'));
        this.buildBtn.on('pointerout', () => this.buildBtn.setTexture('ui_btn_blue'));
        this.buildBtn.on('pointerdown', () => {
            if (this.panelOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        // Listen for gold changes
        scene.eventBus.on('goldChanged', (gold) => this.updateAffordState(gold));
        this.updateAffordState(scene.resourceSystem.getGold());
    }

    openPanel() {
        if (this.panelOpen) return;
        this.panelOpen = true;

        const scene = this.scene;
        const panelX = this.btnX;

        const style = { fontSize: '13px', color: '#fef3c0', fontFamily: 'Arial',
                        stroke: '#3a2a14', strokeThickness: 3 };

        // Click-outside-to-close backdrop
        this.backdrop = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setDepth(949).setInteractive();
        this.backdrop.on('pointerdown', () => this.closePanel());

        // Panel background — vertical layout, 6 items stacked
        const pw = 170, rowH = 45, rows = 6;
        const ph = rowH * rows + 20;
        const panelY = this.btnY + ph / 2 + 10;

        this.panelBg = scene.add.rectangle(panelX, panelY, pw, ph, 0x3a2a14, 0.85)
            .setDepth(950).setStrokeStyle(2, 0xfef3c0);

        // Item definitions
        const items = [
            { name: 'Gold Mine', icon: 'goldmine_active', iconScale: 0.16, cost: GOLDMINE_COST, type: 'goldmine', canAfford: () => this.canAffordMine },
            { name: 'House', icon: 'house', iconScale: 0.16, cost: HOUSE_COST, type: 'house', canAfford: () => this.canAffordHouse },
            { name: 'Barracks', icon: 'barracks', iconScale: 0.19, cost: BARRACKS_COST, type: 'barracks', canAfford: () => this.canAffordBarracks },
            { name: 'Archery', icon: 'archery', iconScale: 0.19, cost: ARCHERY_COST, type: 'archery', canAfford: () => this.canAffordArchery },
            { name: 'Tower', icon: 'tower', iconScale: 0.16, cost: TOWER_COST, type: 'tower', canAfford: () => this.canAffordTower },
            { name: 'Monastery', icon: 'monastery', iconScale: 0.16, cost: MONASTERY_COST, type: 'monastery', canAfford: () => this.canAffordMonastery },
        ];

        const startY = panelY - ((items.length - 1) * rowH) / 2;
        const createdElements = [];

        items.forEach((item, i) => {
            const rowY = startY + i * rowH;

            const icon = scene.add.image(panelX - 55, rowY, item.icon)
                .setScale(item.iconScale).setDepth(952);
            const btn = scene.add.image(panelX + 15, rowY, 'ui_btn_blue')
                .setScale(0.75, 0.65).setDepth(951).setInteractive();
            const label = scene.add.text(panelX + 15, rowY - 8, item.name, style)
                .setOrigin(0.5).setDepth(952);
            const cost = scene.add.text(panelX + 15, rowY + 8, `${item.cost}g`, { ...style, color: '#ffdd44' })
                .setOrigin(0.5).setDepth(952);

            this._setupItemButton(btn, item.type, item.canAfford);

            if (!item.canAfford()) {
                btn.setTexture('ui_btn_disable');
                icon.setAlpha(0.5);
                cost.setColor('#aa6666');
            }

            createdElements.push(icon, btn, label, cost);
        });

        this.panelElements = [this.backdrop, this.panelBg, ...createdElements];
    }

    closePanel() {
        for (const el of this.panelElements) {
            el.destroy();
        }
        this.panelElements = [];
        this.panelOpen = false;
    }

    _setupItemButton(btn, buildType, canAffordFn) {
        btn.on('pointerover', () => {
            if (canAffordFn()) btn.setTexture('ui_btn_hover');
        });
        btn.on('pointerout', () => {
            btn.setTexture(canAffordFn() ? 'ui_btn_blue' : 'ui_btn_disable');
        });
        btn.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            if (!canAffordFn()) return;
            if (this.scene.buildSystem.active) return;
            this.scene.buildSystem.enterBuildMode(buildType);
            this.closePanel();
        });
    }

    updateAffordState(gold) {
        this.canAffordMine = gold >= GOLDMINE_COST;
        this.canAffordBarracks = gold >= BARRACKS_COST;
        this.canAffordTower = gold >= TOWER_COST;
        this.canAffordArchery = gold >= ARCHERY_COST;
        this.canAffordHouse = gold >= HOUSE_COST;
        this.canAffordMonastery = gold >= MONASTERY_COST;
    }
}
