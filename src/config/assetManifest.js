// Centralized asset manifest — all keys, paths, and frame configs

const UNITS_BLUE = 'assets/Units/Blue Units';
const GOBLINS = 'assets/Factions/Goblins/Troops';
const KNIGHTS_BUILDINGS = 'assets/Factions/Knights/Buildings';
const BLUE_BUILDINGS = 'assets/Buildings/Blue Buildings';
const RESOURCES = 'assets/Resources';
const TERRAIN = 'assets/Terrain';
const EFFECTS = 'assets/Effects';

// Spritesheet definitions: { key, path, frameWidth, frameHeight }
export const spritesheets = [
    // --- Player units (single-row strips, 192×192 frames) ---
    { key: 'pawn_idle',        path: `${UNITS_BLUE}/Pawn/Pawn_Idle.png`,              frameWidth: 192, frameHeight: 192 },
    { key: 'pawn_run',         path: `${UNITS_BLUE}/Pawn/Pawn_Run.png`,               frameWidth: 192, frameHeight: 192 },
    { key: 'pawn_interact',    path: `${UNITS_BLUE}/Pawn/Pawn_Interact Pickaxe.png`,  frameWidth: 192, frameHeight: 192 },
    { key: 'pawn_idle_gold',   path: `${UNITS_BLUE}/Pawn/Pawn_Idle Gold.png`,         frameWidth: 192, frameHeight: 192 },
    { key: 'pawn_run_gold',    path: `${UNITS_BLUE}/Pawn/Pawn_Run Gold.png`,          frameWidth: 192, frameHeight: 192 },
    { key: 'warrior_idle',     path: `${UNITS_BLUE}/Warrior/Warrior_Idle.png`,        frameWidth: 192, frameHeight: 192 },
    { key: 'warrior_run',      path: `${UNITS_BLUE}/Warrior/Warrior_Run.png`,         frameWidth: 192, frameHeight: 192 },
    { key: 'warrior_attack',   path: `${UNITS_BLUE}/Warrior/Warrior_Attack1.png`,     frameWidth: 192, frameHeight: 192 },

    // --- Enemy units (multi-row sheets) ---
    { key: 'goblin_torch',     path: `${GOBLINS}/Torch/Red/Torch_Red.png`,   frameWidth: 192, frameHeight: 192 },
    { key: 'goblin_barrel',    path: `${GOBLINS}/Barrel/Red/Barrel_Red.png`,  frameWidth: 128, frameHeight: 128 },
    { key: 'goblin_tnt',       path: `${GOBLINS}/TNT/Red/TNT_Red.png`,       frameWidth: 192, frameHeight: 192 },

    // --- Effects ---
    { key: 'explosions',       path: `${EFFECTS}/Explosion/Explosions.png`,   frameWidth: 192, frameHeight: 192 },
    { key: 'fire',             path: `${EFFECTS}/Fire/Fire.png`,              frameWidth: 128, frameHeight: 128 },

    // --- Resources ---
    { key: 'gold_spawn',       path: `${RESOURCES}/Resources/G_Spawn.png`,    frameWidth: 128, frameHeight: 128 },

    // --- Terrain ---
    { key: 'tilemap_flat',     path: `${TERRAIN}/Ground/Tilemap_Flat.png`,    frameWidth: 64, frameHeight: 64 },
];

// Static image definitions: { key, path }
export const images = [
    // --- Buildings ---
    { key: 'castle_blue',          path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Blue.png` },
    { key: 'castle_construction',  path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Construction.png` },
    { key: 'castle_destroyed',     path: `${KNIGHTS_BUILDINGS}/Castle/Castle_Destroyed.png` },
    { key: 'barracks',             path: `${BLUE_BUILDINGS}/Barracks.png` },

    // --- Gold Mine ---
    { key: 'goldmine_active',      path: `${RESOURCES}/Gold Mine/GoldMine_Active.png` },
    { key: 'goldmine_inactive',    path: `${RESOURCES}/Gold Mine/GoldMine_Inactive.png` },

    // --- Resources UI ---
    { key: 'gold_icon',            path: `${RESOURCES}/Resources/G_Idle.png` },

    // --- Terrain ---
    { key: 'water',                path: `${TERRAIN}/Water/Water.png` },
];
