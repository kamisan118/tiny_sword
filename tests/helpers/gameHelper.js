/**
 * Wait for the game to fully load (GameScene active + gameAPI available).
 */
export async function waitForGameReady(page) {
    await page.goto('/');
    await page.waitForFunction(() => {
        return window.gameAPI &&
               window.game &&
               window.game.scene.getScene('GameScene') &&
               window.game.scene.getScene('GameScene').castle;
    }, { timeout: 10000 });
    // Small extra wait for animations to initialise
    await page.waitForTimeout(500);
}

/**
 * Return the full game state via gameAPI.
 */
export async function getGameState(page) {
    return page.evaluate(() => window.gameAPI.getGameState());
}

/**
 * Collect page errors during a test.
 * Returns an array that is mutated in-place as errors occur.
 */
export function collectPageErrors(page) {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    return errors;
}
