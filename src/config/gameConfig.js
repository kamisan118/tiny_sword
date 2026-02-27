// Game constants
export const TILE_SIZE = 64;
export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const GAME_WIDTH = TILE_SIZE * GRID_COLS;   // 1280
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS;  // 768

// Zones
export const PLAYER_ZONE_MAX_X = 13;   // columns 0-13 for player
export const ENEMY_SPAWN_MIN_X = 18;   // columns 18-19 for enemy spawn

// Starting resources
export const STARTING_GOLD = 100;

// Unit costs
export const WARRIOR_COST = 75;
export const BARRACKS_COST = 150;
export const GOLDMINE_COST = 100;

// Unit stats
export const WARRIOR_HP = 100;
export const WARRIOR_SPEED = 80;
export const WARRIOR_DAMAGE = 15;
export const WARRIOR_ATTACK_RANGE = 1.2; // in tiles
export const WARRIOR_COOLDOWN = 1000;    // ms
export const WARRIOR_PRODUCE_TIME = 10000; // ms

// Building stats
export const CASTLE_HP = 1000;
export const BARRACKS_HP = 500;
export const GOLDMINE_HP = 300;
export const GOLDMINE_INCOME = 25;          // gold per tick
export const GOLDMINE_INCOME_INTERVAL = 5000; // ms

// Wave settings
export const WAVE_INTERVAL = 60000;  // ms
export const MAX_WAVES = 10;
