export default class ControlGroupSystem {
    constructor(scene, selectionSystem) {
        this.scene = scene;
        this.selectionSystem = selectionSystem;

        // Control groups: 1-9 (index 1-9, 0 unused)
        this.controlGroups = Array(10).fill(null).map(() => []);

        // Track last key press time for double-tap detection
        this.lastKeyPress = {};
        this.doubleTapDelay = 300; // ms

        this.setupInput();
    }

    setupInput() {
        // Listen for number keys 1-9
        for (let i = 1; i <= 9; i++) {
            const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[`DIGIT${i}`]);

            key.on('down', () => {
                this.handleNumberKey(i);
            });
        }
    }

    handleNumberKey(number) {
        const ctrlPressed = this.scene.input.keyboard.checkDown(
            this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL)
        );

        if (ctrlPressed) {
            // Ctrl+Number: Create control group
            this.createControlGroup(number);
        } else {
            // Number only: Select control group
            const now = Date.now();
            const lastPress = this.lastKeyPress[number] || 0;
            const isDoubleTap = (now - lastPress) < this.doubleTapDelay;

            this.selectControlGroup(number);

            // Double tap: Jump camera to group center
            if (isDoubleTap) {
                this.jumpToControlGroup(number);
            }

            this.lastKeyPress[number] = now;
        }
    }

    createControlGroup(number) {
        // Store current selection as control group
        const selectedUnits = this.selectionSystem.selectedUnits;

        if (selectedUnits.length === 0) {
            // Clear the control group if no units selected
            this.controlGroups[number] = [];
            return;
        }

        // Store unit IDs instead of direct references
        this.controlGroups[number] = selectedUnits.map(unit => unit.id);

        console.log(`Control group ${number} created with ${selectedUnits.length} units`);
    }

    selectControlGroup(number) {
        const unitIds = this.controlGroups[number];

        if (!unitIds || unitIds.length === 0) {
            return;
        }

        // Clean up dead units from the group
        this.cleanupControlGroup(number);

        // Find alive units
        const unitsToSelect = [];
        for (const unitId of this.controlGroups[number]) {
            const unit = this.scene.playerUnits.find(u => u.id === unitId && u.alive);
            if (unit) {
                unitsToSelect.push(unit);
            }
        }

        if (unitsToSelect.length === 0) {
            return;
        }

        // Deselect all and select control group units
        this.selectionSystem.deselectAll();
        for (const unit of unitsToSelect) {
            this.selectionSystem.selectUnit(unit);
        }

        console.log(`Control group ${number} selected: ${unitsToSelect.length} units`);
    }

    jumpToControlGroup(number) {
        const unitIds = this.controlGroups[number];

        if (!unitIds || unitIds.length === 0) {
            return;
        }

        // Find alive units
        const aliveUnits = [];
        for (const unitId of unitIds) {
            const unit = this.scene.playerUnits.find(u => u.id === unitId && u.alive);
            if (unit) {
                aliveUnits.push(unit);
            }
        }

        if (aliveUnits.length === 0) {
            return;
        }

        // Calculate center position of the group
        let sumX = 0;
        let sumY = 0;
        for (const unit of aliveUnits) {
            sumX += unit.sprite.x;
            sumY += unit.sprite.y;
        }
        const centerX = sumX / aliveUnits.length;
        const centerY = sumY / aliveUnits.length;

        // Pan camera to center
        this.scene.cameras.main.pan(centerX, centerY, 500, 'Sine.easeInOut');

        console.log(`Jumped to control group ${number} at (${Math.round(centerX)}, ${Math.round(centerY)})`);
    }

    cleanupControlGroup(number) {
        if (!this.controlGroups[number]) {
            return;
        }

        // Remove dead units from control group
        const before = this.controlGroups[number].length;
        this.controlGroups[number] = this.controlGroups[number].filter(unitId => {
            const unit = this.scene.playerUnits.find(u => u.id === unitId);
            return unit && unit.alive;
        });

        const after = this.controlGroups[number].length;

        // Clear empty groups
        if (this.controlGroups[number].length === 0) {
            this.controlGroups[number] = [];
        }

        if (before !== after) {
            console.log(`Control group ${number} cleaned: ${before} -> ${after} units`);
        }
    }

    update() {
        // Periodically clean up all control groups
        for (let i = 1; i <= 9; i++) {
            if (this.controlGroups[i].length > 0) {
                this.cleanupControlGroup(i);
            }
        }
    }
}
