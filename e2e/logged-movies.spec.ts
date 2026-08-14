import { test, expect } from "@playwright/test";
import { makeUser, signup, searchFilms, logFirstFilm, setSliderRating } from "./helpers";

test.describe("Logged movies — notes & ratings", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  test("note entered in the log dialog shows on the profile", async ({ page }) => {
    const user = makeUser("note_own");
    await signup(page, user);
    await logFirstFilm(page, { note: "A stunning piece of work" });

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByText(/A stunning piece of work/)).toBeVisible({ timeout: 10_000 });
  });

  test("note is visible to other users", async ({ page }) => {
    const owner = makeUser("note_owner");
    await signup(page, owner);
    await logFirstFilm(page, { note: "A stunning piece of work" });

    const visitor = makeUser("note_viewer");
    await signup(page, visitor);

    await page.goto(`/profile/${owner.username}`);
    await expect(page.getByText(/A stunning piece of work/)).toBeVisible({ timeout: 10_000 });
  });

  test("Rate button opens the edit dialog pre-filled with the rating", async ({ page }) => {
    const user = makeUser("rate_own");
    await signup(page, user);
    await logFirstFilm(page, { rating: 8 });

    await page.goto(`/profile/${user.username}`);
    const rateBtn = page.getByRole("button", { name: "Rate" }).first();
    await expect(rateBtn).toBeVisible({ timeout: 10_000 });
    await rateBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your rating", { exact: true })).toBeVisible();
    await expect(dialog.getByText("8", { exact: true })).toBeVisible();
  });

  test("updating a rating through the Rate dialog persists", async ({ page }) => {
    const user = makeUser("rate_upd");
    await signup(page, user);
    await logFirstFilm(page, { rating: 8 });

    await page.goto(`/profile/${user.username}`);
    const rateBtn = page.getByRole("button", { name: "Rate" }).first();
    await expect(rateBtn).toBeVisible({ timeout: 10_000 });
    await rateBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your rating", { exact: true })).toBeVisible();
    await setSliderRating(dialog, 4);
    await dialog.getByRole("button", { name: "Update" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("4/10")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Genre radar (Genre DNA)", () => {
  test.setTimeout(60_000);

  test("genre radar renders after logging a film", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const user = makeUser("radar_own");
    await signup(page, user);
    await logFirstFilm(page, { query: "The Dark Knight" });

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByText("Genre DNA")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('img[alt^="Genre DNA"]')).toBeVisible({ timeout: 10_000 });
  });

  test("genre radar is absent until films are logged", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const user = makeUser("radar_empty");
    await signup(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByText("Genre DNA")).not.toBeVisible({ timeout: 10_000 });
  });
});