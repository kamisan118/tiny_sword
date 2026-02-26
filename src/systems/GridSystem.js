import { TILE_SIZE, GRID_COLS, GRID_ROWS, PLAYER_ZONE_MAX_X, ENEMY_SPAWN_MIN_X } from '../config/gameConfig.js';

export default class GridSystem {
    constructor() {
        // Occupancy grid: 0 = free, otherwise building/unit id
        this.grid = Array.from({ length: GRID_ROWS }, () =>
            new Array(GRID_COLS).fill(0)
        );
    }

    // Convert grid coords to pixel center
    gridToPixel(gx, gy) {
        return {
            x: gx * TILE_SIZE + TILE_SIZE / 2,
            y: gy * TILE_SIZE + TILE_SIZE / 2
        };
    }

    // Convert pixel to grid coords
    pixelToGrid(px, py) {
        return {
            gx: Math.floor(px / TILE_SIZE),
            gy: Math.floor(py / TILE_SIZE)
        };
    }

    // Mark a rectangular area as occupied
    occupy(gx, gy, width, height, id) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const cx = gx + dx;
                const cy = gy + dy;
                if (this.inBounds(cx, cy)) {
                    this.grid[cy][cx] = id;
                }
            }
        }
    }

    // Free a rectangular area
    free(gx, gy, width, height) {
        this.occupy(gx, gy, width, height, 0);
    }

    // Check if a rectangular area is free
    isFree(gx, gy, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const cx = gx + dx;
                const cy = gy + dy;
                if (!this.inBounds(cx, cy) || this.grid[cy][cx] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if a single cell is walkable (free)
    isWalkable(gx, gy) {
        return this.inBounds(gx, gy) && this.grid[gy][gx] === 0;
    }

    inBounds(gx, gy) {
        return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS;
    }

    isPlayerZone(gx) {
        return gx <= PLAYER_ZONE_MAX_X;
    }

    isEnemySpawnZone(gx) {
        return gx >= ENEMY_SPAWN_MIN_X;
    }

    // Find the nearest free cell adjacent to a building
    findAdjacentFreeCell(gx, gy, width, height) {
        const candidates = [];
        for (let dy = -1; dy <= height; dy++) {
            for (let dx = -1; dx <= width; dx++) {
                if (dy >= 0 && dy < height && dx >= 0 && dx < width) continue; // skip inside
                const cx = gx + dx;
                const cy = gy + dy;
                if (this.isWalkable(cx, cy)) {
                    candidates.push({ gx: cx, gy: cy });
                }
            }
        }
        return candidates.length > 0 ? candidates[0] : null;
    }
}
