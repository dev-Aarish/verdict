import { expect, type Page } from "@playwright/test";

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export function makeUser(prefix: string): TestUser {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    username: `${prefix}_${id}`,
    email: `${prefix}_${id}@test.com`,
    password: "password123",
  };
}

/**
 * Wait until React has hydrated the page. Playwright can interact with the DOM
 * before hydration finishes; React then resets controlled inputs to their
 * (empty) state, silently dropping any value filled in too early. Waiting for
 * React's fiber markers on a rendered input guarantees hydration is complete
 * and onChange handlers are attached.
 */
export async function waitForHydration(page: Page) {
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
export async function fillStable(page: Page, placeholder: string, value: string) {
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
export async function signup(page: Page, user: TestUser) {
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

/**
 * Set a Radix slider value by focusing the thumb and pressing arrow keys. The
 * WatchedEntryDialog slider renders a <span role="slider"> (not an <input>),
 * so Playwright's fill() cannot be used; Radix sliders respond to arrow keys
 * when the thumb has focus.
 */
export async function setSliderRating(dialog: import("@playwright/test").Locator, target: number) {
  const slider = dialog.getByRole("slider");
  await slider.click();
  const current = Number(await slider.getAttribute("aria-valuenow"));
  const steps = target - current;
  if (steps === 0) return;
  const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
  for (let i = 0; i < Math.abs(steps); i++) {
    await slider.press(key);
  }
  await expect(slider).toHaveAttribute("aria-valuenow", String(target));
}

/**
 * Search for a film on the search page and wait until a poster renders. Waits
 * for React hydration first because the search input is a controlled input —
 * a premature fill is silently wiped when hydration resets it.
 */
export async function searchFilms(page: Page, query = "Batman") {
  await page.goto("/search");
  await waitForHydration(page);
  await page.getByPlaceholder("Search by title...").fill(query);
  await expect(page.locator("img[alt]").first()).toBeVisible({ timeout: 15_000 });
}

/**
 * Log the first search result via the rating dialog, optionally passing a note
 * and/or rating. Requires an authenticated session.
 */
export async function logFirstFilm(
  page: Page,
  opts: { query?: string; note?: string; rating?: number } = {},
) {
  await searchFilms(page, opts.query ?? "Batman");
  await page.getByRole("button", { name: "Log it" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Your rating", { exact: true })).toBeVisible();
  if (opts.note !== undefined) {
    await dialog.getByPlaceholder("Why you'll never trust them again…").fill(opts.note);
  }
  if (opts.rating !== undefined) {
    await setSliderRating(dialog, opts.rating);
  }
  await dialog.getByRole("button", { name: "Log it" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
}
