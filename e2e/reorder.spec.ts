import { test, expect } from "@playwright/test";
import { makeUser, signup, waitForHydration, setSliderRating } from "./helpers";

/**
 * Log a specific film via the search page, choosing its rating in the dialog.
 */
async function logFilm(
  page: import("@playwright/test").Page,
  title: string,
  rating: number,
) {
  await page.goto("/search");
  await waitForHydration(page);
  await page.getByPlaceholder("Search by title...").fill(title);
  const card = page.locator('[data-testid="search-result"]', { hasText: title }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole("button", { name: "Log it" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Your rating", { exact: true })).toBeVisible();
  await setSliderRating(dialog, rating);
  await dialog.getByRole("button", { name: "Log it" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
}

/**
 * Return the ordered list of film titles shown in the Watched Films grid.
 */
async function watchedTitles(page: import("@playwright/test").Page): Promise<string[]> {
  const section = page
    .getByRole("heading", { name: "Watched Films" })
    .locator("xpath=ancestor::section[1]");
  await expect(section.getByTestId("watched-film").first()).toBeVisible({ timeout: 10_000 });
  return section.getByTestId("film-title").allTextContents();
}

test.describe("Watched films ordering", () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  test("films default to the order they were logged (custom order)", async ({ page }) => {
    const user = makeUser("order_default");
    await signup(page, user);

    await logFilm(page, "Interstellar", 7);
    await logFilm(page, "Arrival", 7);

    await page.goto(`/profile/${user.username}`);
    const titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Interstellar", "Arrival"]);
  });

  test("sorting by rating high-to-low reorders the grid", async ({ page }) => {
    const user = makeUser("order_rating");
    await signup(page, user);

    await logFilm(page, "Interstellar", 4);
    await logFilm(page, "Arrival", 9);

    await page.goto(`/profile/${user.username}`);
    await page.getByTestId("sort-select").selectOption("rating-desc");
    let titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Arrival", "Interstellar"]);

    await page.getByTestId("sort-select").selectOption("rating-asc");
    titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Interstellar", "Arrival"]);
  });

  test("sorting by title A-Z reorders the grid", async ({ page }) => {
    const user = makeUser("order_title");
    await signup(page, user);

    await logFilm(page, "Inception", 7);
    await logFilm(page, "Her", 7);

    await page.goto(`/profile/${user.username}`);
    await page.getByTestId("sort-select").selectOption("title-asc");
    const titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Her", "Inception"]);
  });

  test("moving a film up/down persists the custom order after reload", async ({ page }) => {
    const user = makeUser("order_move");
    await signup(page, user);

    await logFilm(page, "Interstellar", 7);
    await logFilm(page, "Arrival", 7);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByRole("button", { name: "Move Interstellar down" })).toBeVisible({
      timeout: 10_000,
    });

    // Wait for the reorder to be persisted before asserting/reloading — the UI
    // updates optimistically, so the DOM order alone doesn't prove persistence.
    const reorderDone = page.waitForResponse(
      (resp) =>
        resp.url().includes("/movies/watched/reorder") && resp.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Move Interstellar down" }).click();
    await reorderDone;

    let titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Arrival", "Interstellar"]);

    await page.reload();
    titles = await watchedTitles(page);
    expect(titles.slice(0, 2)).toEqual(["Arrival", "Interstellar"]);
  });

  test("reorder controls are not shown to visitors", async ({ page }) => {
    const owner = makeUser("order_owner");
    await signup(page, owner);
    await logFilm(page, "Interstellar", 7);

    const visitor = makeUser("order_visor");
    await signup(page, visitor);

    await page.goto(`/profile/${owner.username}`);
    await expect(page.getByTestId("sort-select")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Move .* up/ })).toHaveCount(0);
  });
});