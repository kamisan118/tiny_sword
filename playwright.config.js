import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/specs',
    timeout: 30000,
    retries: 0,
    workers: 1,
    use: {
        baseURL: 'http://localhost:8080',
        viewport: { width: 1280, height: 768 },
        headless: true,
        screenshot: 'only-on-failure',
    },
});
