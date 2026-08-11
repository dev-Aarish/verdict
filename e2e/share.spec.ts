import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const USER = {
  username: `share_${ID}`,
  email: `share_${ID}@test.com`,
  password: "password123",
};

test.describe("Share page", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(USER.username);
    await page.getByPlaceholder("you@screening.room").fill(USER.email);
    await page.getByPlaceholder("At least 8 characters").fill(USER.password);
    await page.getByRole("button", { name: /Enter the room/ }).click();
    try {
      await page.waitForURL(/\/profile\//, { timeout: 15000 });
    } catch {
      await page.goto("/login");
      await page.getByPlaceholder("you@screening.room").fill(USER.email);
      await page.getByPlaceholder("••••••••").fill(USER.password);
      await page.getByRole("button", { name: /Take your seat/ }).click();
      await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    }
  });

  test("renders shareable card page", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText("Shareable")).toBeVisible();
    await expect(page.getByText("Verdict card")).toBeVisible();
    await expect(page.getByText("← Back to profile")).toBeVisible();
  });

  test("card shows username", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText(`@${USER.username}`, { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test("card shows Taste Score", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText("Taste Score")).toBeVisible({ timeout: 10000 });
  });

  test("card shows film count", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText(/films/)).toBeVisible({ timeout: 10000 });
  });

  test("Download button is visible", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible({ timeout: 10000 });
  });

  test("Copy link button is visible", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible({ timeout: 10000 });
  });

  test("back to profile link works", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await page.getByText("← Back to profile").click();
    await expect(page).toHaveURL(new RegExp(`/profile/${USER.username}`));
  });

  test("shows Now Showing section", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText("Now Showing")).toBeVisible({ timeout: 10000 });
  });

  test("shows Est. 2026 on card", async ({ page }) => {
    await page.goto(`/share/${USER.username}`);
    await expect(page.getByText("Est. 2026")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Share page - non-existent user", () => {
  test("shows User not found for invalid username", async ({ page }) => {
    await page.goto("/share/thisuserdoesnotexist12345");
    await expect(page.getByText("User not found.")).toBeVisible({ timeout: 10000 });
  });
});
