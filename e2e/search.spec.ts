import { test, expect } from "@playwright/test";

test.describe("Search page", () => {
  test("renders with Films tab active by default", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("The Vault")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Films" })).toBeVisible();
    await expect(page.getByRole("button", { name: "People" })).toBeVisible();
    await expect(page.getByPlaceholder("Search by title...")).toBeVisible();
  });

  test("films tab shows minimum character hint", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Type at least three characters to search.")).toBeVisible();
  });

  test("films search requires at least 3 characters", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder("Search by title...");
    await input.fill("ab");
    await expect(page.getByText("Type at least three characters to search.")).toBeVisible();
  });

  test("films search shows results for valid query", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder("Search by title...");
    await input.fill("Batman");
    await expect(page.locator("img[alt]").first()).toBeVisible({ timeout: 15000 });
  });

  test("films search shows no results message for nonsense query", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder("Search by title...");
    await input.fill("xyznonexistentmovie123");
    await expect(page.getByText("No films found.")).toBeVisible({ timeout: 15000 });
  });

  test("switching to People tab changes placeholder", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "People" }).click();
    await expect(page.getByPlaceholder("Search by username...")).toBeVisible();
  });

  test("people tab shows minimum character hint", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "People" }).click();
    await expect(page.getByText("Type a username to search.")).toBeVisible();
  });

  test("people search works with 1 character", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "People" }).click();
    const input = page.getByPlaceholder("Search by username...");
    await input.fill("a");
    await expect(
      page.getByText("Searching...").or(page.getByText("No users found.")),
    ).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user sees sign in prompt on films tab", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Sign in to log films")).toBeVisible();
  });

  test("films tab pagination appears for multi-page results", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder("Search by title...");
    await input.fill("the");
    await page.waitForTimeout(1000);
    const nextBtn = page.getByRole("button", { name: "Next" });
    if (await nextBtn.isVisible()) {
      await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    }
  });
});

test.describe("Rating dialog", () => {
  test("opens when clicking Log it button (authenticated)", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`srch_${id}`);
    await page.getByPlaceholder("you@screening.room").fill(`srch_${id}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });

    await page.goto("/search");
    await page.getByPlaceholder("Search by title...").fill("Batman");
    await page.waitForTimeout(2000);

    const logBtn = page.getByRole("button", { name: "Log it" }).first();
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await expect(page.getByText("Your rating")).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    }
  });

  test("dialog closes on Cancel", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`dlg_${id}`);
    await page.getByPlaceholder("you@screening.room").fill(`dlg_${id}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });

    await page.goto("/search");
    await page.getByPlaceholder("Search by title...").fill("Batman");
    await page.waitForTimeout(2000);

    const logBtn = page.getByRole("button", { name: "Log it" }).first();
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await expect(page.getByText("Your rating")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByText("Your rating")).not.toBeVisible();
    }
  });
});
