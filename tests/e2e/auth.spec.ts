import { test, expect } from "@playwright/test";

test.use({
    storageState: { cookies: [], origins: [] },
});

test("auth: unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/week");
    await expect(page).toHaveURL(/\/login\?next=%2Fweek/);
});

test("auth: user can log in from login page", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD are required for login test.");

    await page.goto("/login");
    await page.locator('input[name="email"]').first().fill(email!);
    await page.locator('input[name="password"]').first().fill(password!);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/week/);
    await expect(page.getByRole("heading", { name: "Week" })).toBeVisible();
});

test("auth: forgot and reset routes are reachable", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/password\/forgot/);

    await page.goto("/password/reset");
    await expect(page).toHaveURL(/\/password\/reset/);
});
