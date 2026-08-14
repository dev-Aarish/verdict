import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const USER = {
  username: `share_${ID}`,
  email: `share_${ID}@test.com`,
  password: "password123",
};

/**
 * Wait until React has hydrated the page. Playwright can interact with the DOM
 * before hydration finishes; React then resets controlled inputs to their
 * (empty) state, silently dropping any value filled in too early. Waiting for
 * React's fiber markers on a rendered input guarantees hydration is complete
 * and onChange handlers are attached.
 */
async function waitForHydration(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("input");
    return el != null && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  }, undefined, { timeout: 10_000 });
}

/**
 * Fill an input, retrying until the value actually sticks. This is a safety net
 * on top of waitForHydration for any edge-case re-render that could wipe the
 * field.
 */
async function fillStable(page: import("@playwright/test").Page, placeholder: string, value: string) {
  const input = page.getByPlaceholder(placeholder);
  await expect(async () => {
    await input.fill(value);
    expect(await input.inputValue()).toBe(value);
  }).toPass({ timeout: 10_000 });
}

/**
 * Ensure the user is signed in. Users persist in the DB across runs (and across
 * tests in this file), so signup only succeeds the first time — afterwards the
 * server rejects it with an alert. Detect that alert immediately instead of
 * burning a full waitForURL timeout, then fall back to logging in.
 */
async function signup(page: import("@playwright/test").Page, user: { username: string; email: string; password: string }) {
  const profileUrl = new RegExp(`/profile/${user.username}`);

  await page.goto("/signup");
  await waitForHydration(page);
  await fillStable(page, "mira_k", user.username);
  await fillStable(page, "you@screening.room", user.email);
  await fillStable(page, "At least 8 characters", user.password);
  await page.getByRole("button", { name: /Enter the room/ }).click();

  const signedUp = await Promise.race([
    page.waitForURL(profileUrl, { timeout: 15_000 }).then(() => true).catch(() => false),
    page.waitForEvent("dialog", { timeout: 15_000 }).then(() => false).catch(() => false),
  ]);
  if (signedUp) return;

  // Account already exists → log in instead.
  await page.goto("/login");
  await waitForHydration(page);
  await fillStable(page, "you@screening.room", user.email);
  await fillStable(page, "••••••••", user.password);
  await page.getByRole("button", { name: /Take your seat/ }).click();
  await expect(page).toHaveURL(profileUrl, { timeout: 15_000 });
}

test.describe("Share page", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await signup(page, USER);
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
  test("shows branded 404 for invalid username", async ({ page }) => {
    await page.goto("/share/thisuserdoesnotexist12345");
    await expect(page.getByText("This reel isn't in the archive.")).toBeVisible({
      timeout: 10000,
    });
  });
});
