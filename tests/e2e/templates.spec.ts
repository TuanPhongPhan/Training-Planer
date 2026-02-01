import { test, expect } from "@playwright/test";

test("templates: delete requires double confirmation", async ({ page }) => {
    const name = `E2E Template ${Date.now()}`;

    await page.goto("/templates");

    await page.getByTestId("create-template").click();
    await page.getByTestId("template-name").fill(name);
    await page.getByTestId("template-save").click();

    const card = page.getByTestId("template-card").filter({ hasText: name }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    // open menu
    await card.getByTestId("template-menu-open").click();

    // open delete dialog
    await page.getByTestId("template-delete-open").click();

    // click confirm INSIDE dialog
    const confirm = page.getByTestId("template-delete-confirm");
    await expect(confirm).toBeVisible();
    await confirm.click();

    // assert card removed
    await expect(card).toHaveCount(0);

});
