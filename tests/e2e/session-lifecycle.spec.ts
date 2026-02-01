import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

test("session lifecycle: plan → complete → appears in log", async ({ page }, testInfo) => {
    const name = `E2E:${testInfo.testId}:${randomUUID()}`;

    //  Go to Week
    await page.goto("/week");

    // Create planned session
    await page.getByTestId("add-session").click();
    await page.getByTestId("session-title").fill(name);
    await page.getByTestId("session-save").click();

    // Wait for modal to close
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 }).catch(() => {});

    // Wait for card
    const card = page.getByTestId("planned-session").first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Complete session
    await card.getByText("Complete").click();

    const saveBtn = page.getByTestId("save-completed-session");
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Wait for completion to settle
    await expect(card).toContainText(/done|completed/i, { timeout: 15_000 });

    // Verify in Log
    await page.goto("/log");

    const logItem = page.getByText(name).first();
    await expect(logItem).toBeVisible({ timeout: 20_000 });
});
