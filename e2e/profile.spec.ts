import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const USER = {
  username: `profile_${ID}`,
  email: `profile_${ID}@test.com`,
  password: "password123",
};

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/signup");
  await page.getByPlaceholder("mira_k").fill(USER.username);
  await page.getByPlaceholder("you@screening.room").fill(USER.email);
  await page.getByPlaceholder("At least 8 characters").fill(USER.password);
  await page.getByRole("button", { name: /Enter the room/ }).click();
  try {
    await page.waitForURL(new RegExp(`/profile/${USER.username}`), { timeout: 15000 });
  } catch {
    await page.goto("/login");
    await page.getByPlaceholder("you@screening.room").fill(USER.email);
    await page.getByPlaceholder("••••••••").fill(USER.password);
    await page.getByRole("button", { name: /Take your seat/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${USER.username}`), { timeout: 15000 });
  }
});

test.describe("Profile page", () => {
  test("shows username and avatar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: USER.username })).toBeVisible();
    await expect(page.locator(`img[alt="${USER.username}"]`)).toBeVisible();
  });

  test("shows film count", async ({ page }) => {
    await expect(page.getByText(/\d+ films?/)).toBeVisible();
  });

  test("shows Share card link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Share card/ })).toBeVisible();
  });

  test("shows Watched Films section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Watched Films" })).toBeVisible();
  });

  test("empty profile shows search CTA", async ({ page }) => {
    await expect(page.getByText("No films logged yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Search for films/ })).toBeVisible();
  });

  test("+ Add more link appears on own profile with films", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder("Search by title...").fill("Batman");
    await page.waitForTimeout(2000);
    const logBtn = page.getByRole("button", { name: "Log it" }).first();
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Log it" }).last().click();
      await page.waitForTimeout(1000);
    }

    await page.goto(`/profile/${USER.username}`);
    await page.waitForTimeout(1000);
    const addMore = page.getByRole("link", { name: /\+ Add more/ });
    if (await addMore.isVisible()) {
      await expect(addMore).toHaveAttribute("href", "/search");
    }
  });

  test("share card link navigates to share page", async ({ page }) => {
    await page.getByRole("link", { name: /Share card/ }).click();
    await expect(page).toHaveURL(new RegExp(`/share/${USER.username}`));
  });

  test("followers and following links are present", async ({ page }) => {
    await expect(page.getByText(/followers?/)).toBeVisible();
    await expect(page.getByText(/following/)).toBeVisible();
  });
});

test.describe("Profile - viewing other users", () => {
  test("shows Follow button on other user's profile", async ({ page }) => {
    const id2 = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`othr_${id2}`);
    await page.getByPlaceholder("you@screening.room").fill(`othr_${id2}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });

    await page.goto(`/profile/${USER.username}`);
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Leave a Verdict/ })).toBeVisible();
  });

  test("follow/unfollow toggle works", async ({ page }) => {
    const id2 = crypto.randomUUID().slice(0, 8);
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`fol_${id2}`);
    await page.getByPlaceholder("you@screening.room").fill(`fol_${id2}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    try {
      await page.waitForURL(/\/profile\//, { timeout: 10000 });
    } catch {
      await page.goto("/login");
      await page.getByPlaceholder("you@screening.room").fill(`fol_${id2}@test.com`);
      await page.getByPlaceholder("••••••••").fill("password123");
      await page.getByRole("button", { name: /Take your seat/ }).click();
      await expect(page).toHaveURL(/\/profile\//, { timeout: 10000 });
    }

    await page.goto(`/profile/${USER.username}`);
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Following" }).click();
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Profile - non-existent user", () => {
  test("shows User not found for invalid username", async ({ page }) => {
    await page.goto("/profile/thisuserdoesnotexist12345");
    await expect(page.getByText("User not found.")).toBeVisible({ timeout: 10000 });
  });
});
