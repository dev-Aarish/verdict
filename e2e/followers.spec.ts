import { test, expect } from "@playwright/test";
import { makeUser, signup } from "./helpers";

test.describe("Followers & following pages", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  test("own followers page shows empty state", async ({ page }) => {
    const user = makeUser("fol_own");
    await signup(page, user);
    await page.goto(`/profile/${user.username}/followers`);
    await expect(page.getByRole("heading", { name: "Your Followers" })).toBeVisible();
    await expect(page.getByText("No followers yet.")).toBeVisible();
  });

  test("own following page shows empty state", async ({ page }) => {
    const user = makeUser("fol_empty");
    await signup(page, user);
    await page.goto(`/profile/${user.username}/following`);
    await expect(page.getByRole("heading", { name: "Your Following" })).toBeVisible();
    await expect(page.getByText("Not following anyone yet.")).toBeVisible();
  });

  test("following a user lists them on your following page", async ({ page }) => {
    const target = makeUser("fol_target");
    await signup(page, target);

    const viewer = makeUser("fol_viewer");
    await signup(page, viewer);

    // viewer follows target
    await page.goto(`/profile/${target.username}`);
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible({ timeout: 5_000 });

    await page.goto(`/profile/${viewer.username}/following`);
    await expect(page.getByRole("heading", { name: "Your Following" })).toBeVisible();
    await expect(page.getByRole("link", { name: target.username })).toBeVisible({ timeout: 10_000 });
  });

  test("follower appears on the target's followers page", async ({ page }) => {
    const target = makeUser("fol_t2");
    await signup(page, target);

    const follower = makeUser("fol_f2");
    await signup(page, follower);

    await page.goto(`/profile/${target.username}`);
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible({ timeout: 5_000 });

    await page.goto(`/profile/${target.username}/followers`);
    await expect(page.getByRole("heading", { name: `${target.username}'s Followers` })).toBeVisible();
    await expect(page.getByRole("link", { name: follower.username })).toBeVisible({ timeout: 10_000 });
  });

  test("back link on followers page returns to profile", async ({ page }) => {
    const user = makeUser("fol_back");
    await signup(page, user);
    await page.goto(`/profile/${user.username}/followers`);
    await page.getByRole("link", { name: /← Back to your profile/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${user.username}$`));
  });
});