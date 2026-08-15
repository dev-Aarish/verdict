import { test, expect } from "@playwright/test";
import { makeUser, signup, searchFilms, logFirstFilm } from "./helpers";

test.describe("Film details page", () => {
  test.setTimeout(60_000);

  test("opens a film page from a search result", async ({ page }) => {
    await searchFilms(page);
    await page.locator("img[alt]").first().click();
    await expect(page).toHaveURL(/\/film\/tt\d+/);
  });

  test("shows the film title and The Jury heading", async ({ page }) => {
    await searchFilms(page, "The Dark Knight");
    await page.locator("img[alt]").first().click();
    await expect(page.getByRole("heading", { name: "The Dark Knight" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("The Jury")).toBeVisible();
  });

  test("shows director, plot and cast for a known film", async ({ page }) => {
    await searchFilms(page, "The Dark Knight");
    await page.locator("img[alt]").first().click();
    await expect(page.getByText(/Directed by/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Christopher Nolan", { exact: true })).toBeVisible();
    await expect(page.getByText("Cast")).toBeVisible();
    await expect(page.getByText(/Christian Bale/)).toBeVisible();
  });

  test("shows the Who logged it section", async ({ page }) => {
    await searchFilms(page, "The Dark Knight");
    await page.locator("img[alt]").first().click();
    await expect(page.getByRole("heading", { name: /Who logged it/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("back link returns to the previous page (search)", async ({ page }) => {
    await searchFilms(page, "The Dark Knight");
    await page.locator("img[alt]").first().click();
    await page.getByText("← Back").click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("back link returns to the profile it was opened from", async ({ page }) => {
    const user = makeUser("filmback");
    await signup(page, user);
    await logFirstFilm(page, { query: "The Dark Knight" });

    // Head to the user's own profile and open the film from there.
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`), { timeout: 10_000 });
    await page.locator('[data-testid="watched-film"] img').first().click();
    await expect(page).toHaveURL(/\/film\/tt\d+/, { timeout: 15_000 });

    await page.getByText("← Back").click();
    await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`), { timeout: 10_000 });
  });

  test("shows branded 404 for an unknown film id", async ({ page }) => {
    await page.goto("/film/tt0000000");
    await expect(page.getByText("This reel isn't in the archive.")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Film page watchlist toggle", () => {
  test.setTimeout(60_000);

  test("adds and removes a film from the watchlist on the film page", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const user = makeUser("filmwl");
    await signup(page, user);

    await searchFilms(page, "The Dark Knight");
    await page.locator("img[alt]").first().click();
    await expect(page.getByRole("heading", { name: "The Dark Knight" })).toBeVisible({
      timeout: 15_000,
    });

    const toggle = page.getByRole("button", { name: /Worth your time\? Add to watchlist/ });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page.getByRole("button", { name: /On your watchlist — remove/ }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /On your watchlist — remove/ }).click();
    await expect(
      page.getByRole("button", { name: /Worth your time\? Add to watchlist/ }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
