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

async function signup(page: import("@playwright/test").Page, user: { username: string; email: string; password: string }) {
  await page.goto("/signup");
  await page.getByPlaceholder("mira_k").fill(user.username);
  await page.getByPlaceholder("you@screening.room").fill(user.email);
  await page.getByPlaceholder("At least 8 characters").fill(user.password);
  await page.getByRole("button", { name: /Enter the room/ }).click();
  try {
    await page.waitForURL(/\/profile\//, { timeout: 10000 });
    return;
  } catch {
    // Signup may have succeeded but redirect was slow, or user already exists
  }
  await page.goto("/login");
  await page.getByPlaceholder("you@screening.room").fill(user.email);
  await page.getByPlaceholder("••••••••").fill(user.password);
  await page.getByRole("button", { name: /Take your seat/ }).click();
  await page.waitForURL(/\/profile\//, { timeout: 10000 });
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
    await expect(page.getByText("In the matter of")).toBeVisible();
    await expect(page.getByText(TO_USER.username)).toBeVisible();
    await expect(page.getByText("The Score")).toBeVisible();
    await expect(page.getByText("The Verdict")).toBeVisible();
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Withdraw/ })).toBeVisible();
  });

  test("score slider default is 7", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const slider = page.getByRole("slider", { name: "Score" });
    await expect(slider).toHaveValue("7");
  });

  test("score slider changes value", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const slider = page.getByRole("slider", { name: "Score" });
    await slider.fill("3");
    await expect(slider).toHaveValue("3");
  });

  test("verdict text input has 80 char limit", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await expect(input).toBeVisible();
    await input.fill("A".repeat(80));
    await expect(page.getByText("80/80")).toBeVisible();
  });

  test("character count updates as you type", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Hello");
    await expect(page.getByText("5/80")).toBeVisible();
  });

  test("stamp it button is disabled when line is empty", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeDisabled();
  });

  test("stamp it button enabled when line has text", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Great taste");
    await expect(page.getByRole("button", { name: /Stamp it/ })).toBeEnabled();
  });

  test("submitting verdict shows stamped confirmation", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    const input = page.locator("input[placeholder='One line. No hedging.']");
    await input.fill("Excellent taste in films");
    await page.getByRole("button", { name: /Stamp it/ }).click();
    await expect(page.getByText("Verdict recorded")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Excellent taste in films")).toBeVisible();
  });

  test("withdraw link navigates back to profile", async ({ page }) => {
    await page.goto(`/verdict/${TO_USER.username}`);
    await page.getByRole("link", { name: /Withdraw/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${TO_USER.username}`));
  });
});
