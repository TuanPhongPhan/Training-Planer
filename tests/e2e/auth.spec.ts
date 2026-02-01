import { test, expect } from "@playwright/test";

test("auth: user can access app shell after login", async ({ page }) => {
    await page.goto("/week");
    await expect(page).toHaveURL(/\/week/);

    // unique + stable
    await expect(page.getByRole("heading", { name: "Week" })).toBeVisible();
});