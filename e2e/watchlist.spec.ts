import { test, expect } from "@playwright/test";
import { makeUser, signup, searchFilms } from "./helpers";

test.describe("To Watch (watchlist)", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  test("empty queue shows the browse CTA on own profile", async ({ page }) => {
    const user = makeUser("wl_empty");
    await signup(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByRole("heading", { name: "Worth Your Time" })).toBeVisible();
    await expect(page.getByText(/Nothing on the queue/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse films to save/ })).toBeVisible();
  });

  test("Watch button in search toggles to Saved", async ({ page }) => {
    const user = makeUser("wl_toggle");
    await signup(page, user);

    await searchFilms(page, "Inception");
    const watch = page.getByRole("button", { name: /Watch/ }).first();
    await expect(watch).toBeVisible();
    await watch.click();
    await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("saved film appears in the profile's Worth Your Time queue", async ({ page }) => {
    const user = makeUser("wl_queue");
    await signup(page, user);

    await searchFilms(page, "Inception");
    await page.getByRole("button", { name: /Watch/ }).first().click();
    await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/profile/${user.username}`);
    const queue = page
      .getByRole("heading", { name: "Worth Your Time" })
      .locator("xpath=ancestor::section[1]");
    await expect(queue.getByText(/Inception/)).toBeVisible({ timeout: 10_000 });
  });

  test("Log it moves a film from the queue to the watched list", async ({ page }) => {
    const user = makeUser("wl_move");
    await signup(page, user);

    await searchFilms(page, "Inception");
    await page.getByRole("button", { name: /Watch/ }).first().click();
    await expect(page.getByRole("button", { name: "Saved" }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/profile/${user.username}`);
    const queueSection = page
      .getByRole("heading", { name: "Worth Your Time" })
      .locator("xpath=ancestor::section[1]");
    const logBtn = queueSection.getByRole("button", { name: "Log it" }).first();
    await expect(logBtn).toBeVisible({ timeout: 10_000 });
    await logBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your rating", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Log it" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

// Queue is cleared client-side; reload to confirm the move persisted.
    await page.reload();
    const watchedSection = page
      .getByRole("heading", { name: "Watched Films" })
      .locator("xpath=ancestor::section[1]");
    await expect(watchedSection.getByRole("link", { name: /Inception/ }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Nothing on the queue/)).toBeVisible({ timeout: 10_000 });
  });
});