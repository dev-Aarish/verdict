import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const FROM_USER = {
  username: `vfrom_${ID}`,
  email: `vfrom_${ID}@test.com`,
  password: "password123",
};
const TO_USER = {
  username: `vto_${ID}`,
  email: `vto_${ID}@test.com`,
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

test.describe("Verdict page", () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await signup(page, TO_USER);
    await signup(page, FROM_USER);
  });

  test("renders with username and form elements", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    await expect(page.getByText("In the matter of")).toBeVisible();
    await expect(page.getByText(TO_USER.username)).toBeVisible();
    await expect(page.getByText("The Score")).toBeVisible();
    await expect(page.getByText("The Verdict")).toBeVisible();
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Withdraw/ })).toBeVisible();
  });

  test("score slider default is 7", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const slider = page.getByRole("slider", { name: "Score" });
    await expect(slider).toHaveValue("7");
  });

  test("score slider changes value", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const slider = page.getByRole("slider", { name: "Score" });
    await slider.fill("3");
    await expect(slider).toHaveValue("3");
  });

  test("verdict text input has 80 char limit", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await expect(input).toBeVisible();
    await input.fill("A".repeat(80));
    await expect(page.getByText("80/80")).toBeVisible();
  });

  test("character count updates as you type", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Hello");
    await expect(page.getByText("5/80")).toBeVisible();
  });

  test("stamp it button is disabled when line is empty", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeDisabled();
  });

  test("stamp it button enabled when line has text", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Great taste");
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeEnabled();
  });

  test("submitting verdict shows stamped confirmation", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Excellent taste in films");
    await page.getByRole("button", { name: /Stamp it/ }).click();
    await expect(page.getByText("Verdict recorded")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Excellent taste in films")).toBeVisible();
  });

  test("withdraw link navigates back to profile", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await waitForHydration(page);
    await page.getByRole("link", { name: /Withdraw/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${TO_USER.username}`));
  });
});
