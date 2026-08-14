import { test, expect } from "@playwright/test";
import { makeUser, signup, logFirstFilm } from "./helpers";

test.describe("Taste matching", () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  test("shows shared films and agreement when both have logged the same film", async ({
    page,
  }) => {
    const userA = makeUser("tm_a");
    await signup(page, userA);
    await logFirstFilm(page, { query: "The Dark Knight", rating: 8 });

    const userB = makeUser("tm_b");
    await signup(page, userB);
    await logFirstFilm(page, { query: "The Dark Knight", rating: 8 });

    // B views A's profile — both rated The Dark Knight an 8.
    await page.goto(`/profile/${userA.username}`);
    const card = page.getByText("TASTE MATCH");
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/share 1 film/)).toBeVisible();
    await expect(page.getByText(/100% rating agreement/)).toBeVisible();
  });

  test("does not show a taste match on your own profile", async ({ page }) => {
    const user = makeUser("tm_own");
    await signup(page, user);
    await logFirstFilm(page, { query: "The Dark Knight", rating: 8 });

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByText("TASTE MATCH")).not.toBeVisible({ timeout: 10_000 });
  });
});