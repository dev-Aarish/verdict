import { test, expect } from "@playwright/test";
import { waitForHydration, fillStable } from "./helpers";

const ID = crypto.randomUUID().slice(0, 8);
const USER = {
  username: `feed_${ID}`,
  email: `feed_${ID}@test.com`,
  password: "password123",
};

test.describe("Feed page", () => {
  test("renders with heading and leaderboard", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByText("The Reel")).toBeVisible();
    await expect(page.getByText("Recent Verdicts")).toBeVisible();
    await expect(page.getByText("Leaderboard")).toBeVisible();
  });

  test("unauthenticated user does not see filter buttons", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("button", { name: "Following" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "All" })).not.toBeVisible();
  });

  test("authenticated user sees filter buttons", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await waitForHydration(page);
    await fillStable(page, "mira_k", USER.username);
    await fillStable(page, "you@screening.room", USER.email);
    await fillStable(page, "At least 8 characters", USER.password);
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });

    await page.goto("/feed");
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("filter buttons toggle between Following and All", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await waitForHydration(page);
    await fillStable(page, "mira_k", `flt_${id}`);
    await fillStable(page, "you@screening.room", `flt_${id}@test.com`);
    await fillStable(page, "At least 8 characters", "password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });

    await page.goto("/feed");
    const followingBtn = page.getByRole("button", { name: "Following" });
    const allBtn = page.getByRole("button", { name: "All" });
    await expect(followingBtn).toBeVisible();
    await allBtn.click();
    await expect(allBtn).toHaveClass(/border-brass/);
  });

  test("leaderboard section renders", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  });
});
