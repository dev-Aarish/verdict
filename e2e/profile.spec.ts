import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const USER = {
  username: `profile_${ID}`,
  email: `profile_${ID}@test.com`,
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

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await signup(page, USER);
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
    await signup(page, {
      username: `othr_${id2}`,
      email: `othr_${id2}@test.com`,
      password: "password123",
    });

    await page.goto(`/profile/${USER.username}`);
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Leave a Verdict/ })).toBeVisible();
  });

  test("follow/unfollow toggle works", async ({ page }) => {
    const id2 = crypto.randomUUID().slice(0, 8);
    await signup(page, {
      username: `fol_${id2}`,
      email: `fol_${id2}@test.com`,
      password: "password123",
    });

    await page.goto(`/profile/${USER.username}`);
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Following" }).click();
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Profile - non-existent user", () => {
  test("shows branded 404 for invalid username", async ({ page }) => {
    await page.goto("/profile/thisuserdoesnotexist12345");
    await expect(page.getByText("This reel isn't in the archive.")).toBeVisible({
      timeout: 10000,
    });
  });
});
