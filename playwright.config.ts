import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",

    globalSetup: "./playwright/global-setup.ts",

    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        storageState: "playwright/.auth/state.json",
        trace: "retain-on-failure",
    },

    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
    },

    globalTeardown: require.resolve("./playwright/global-teardown"),
    workers: process.env.CI ? 1 : 1,

});
