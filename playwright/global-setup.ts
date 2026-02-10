// playwright/global-setup.ts
import { chromium } from "@playwright/test";

/**
 * Global setup:
 * - Opens /login
 * - Fills email + password (your UI uses name="email" and name="password")
 * - Clicks "Continue"
 * - Saves authenticated storageState for reuse in all E2E tests
 *
 * Requires env vars:
 * - PLAYWRIGHT_BASE_URL (optional, defaults to http://localhost:3000)
 * - E2E_EMAIL
 * - E2E_PASSWORD
 */
export default async function globalSetup() {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "Missing E2E_EMAIL or E2E_PASSWORD. Load .env.e2e (e.g. `dotenv -e .env.e2e -- playwright test`)."
        );
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Go to log in and wait for DOM to be ready
    await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });

    await page.locator('input[name="email"]').first().fill(email);
    await page.locator('input[name="password"]').first().fill(password);

    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for app navigation after successful login
    await page.waitForURL(/\/(week|templates|log)(\?|$)/, { timeout: 30_000 });

    // Save authenticated state so tests can reuse it (configured in playwright.config.ts via use.storageState)
    await context.storageState({ path: "playwright/.auth/state.json" });

    await browser.close();
}
