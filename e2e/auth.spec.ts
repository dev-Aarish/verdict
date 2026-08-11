import { test, expect } from "@playwright/test";

const ID = crypto.randomUUID().slice(0, 8);
const TEST_USER = {
  username: `testuser_${ID}`,
  email: `test_${ID}@example.com`,
  password: "password123",
};

test.describe("Signup flow", () => {
  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("New patron")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Get on the list" })).toBeVisible();
    await expect(page.getByPlaceholder("mira_k")).toBeVisible();
    await expect(page.getByPlaceholder("you@screening.room")).toBeVisible();
    await expect(page.getByPlaceholder("At least 8 characters")).toBeVisible();
    await expect(page.getByRole("button", { name: /Enter the room/ })).toBeVisible();
  });

  test("signup form submits and redirects to profile", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(TEST_USER.username);
    await page.getByPlaceholder("you@screening.room").fill(TEST_USER.email);
    await page.getByPlaceholder("At least 8 characters").fill(TEST_USER.password);
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${TEST_USER.username}`), { timeout: 15000 });
  });

  test("shows entering state while submitting", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`slow_${id}`);
    await page.getByPlaceholder("you@screening.room").fill(`slow_${id}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page.getByRole("button", { name: /Entering/ })).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/signup");
    const pwInput = page.getByPlaceholder("At least 8 characters");
    await expect(pwInput).toHaveAttribute("type", "password");
    await page.getByLabel("Show password").click();
    await expect(pwInput).toHaveAttribute("type", "text");
    await page.getByLabel("Hide password").click();
    await expect(pwInput).toHaveAttribute("type", "password");
  });

  test("link to login page works", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("main").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Members", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByPlaceholder("you@screening.room")).toBeVisible();
    await expect(page.getByRole("button", { name: /Take your seat/ })).toBeVisible();
  });

  test("login form submits and redirects to profile", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/login");
    await page.getByPlaceholder("you@screening.room").fill(TEST_USER.email);
    await page.getByPlaceholder("••••••••").fill(TEST_USER.password);
    await page.getByRole("button", { name: /Take your seat/ }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${TEST_USER.username}`), { timeout: 15000 });
  });

  test("shows checking state while submitting", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/login");
    await page.getByPlaceholder("you@screening.room").fill("x@x.com");
    await page.getByPlaceholder("••••••••").fill("password123");
    await page.getByRole("button", { name: /Take your seat/ }).click();
    await expect(page.getByRole("button", { name: /Checking/ })).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const pwInput = page.getByPlaceholder("••••••••");
    await expect(pwInput).toHaveAttribute("type", "password");
    await page.getByLabel("Show password").click();
    await expect(pwInput).toHaveAttribute("type", "text");
    await page.getByLabel("Hide password").click();
    await expect(pwInput).toHaveAttribute("type", "password");
  });

  test("link to signup page works", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("main").getByRole("link", { name: /Get on the list/ }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("invalid credentials shows error", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/login");
    await page.getByPlaceholder("you@screening.room").fill("nonexistent@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: /Take your seat/ }).click();
    await expect(page.getByRole("button", { name: /Take your seat/ })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Logout flow", () => {
  test("authenticated user sees Profile and Sign out in TopBar", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`out_${id}`);
    await page.getByPlaceholder("you@screening.room").fill(`out_${id}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    await expect(page.getByRole("navigation").getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("sign out redirects to home and shows sign in link", async ({ page }) => {
    const id = crypto.randomUUID().slice(0, 8);
    page.on("dialog", (d) => d.accept());
    await page.goto("/signup");
    await page.getByPlaceholder("mira_k").fill(`so_${id}`);
    await page.getByPlaceholder("you@screening.room").fill(`so_${id}@test.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: /Enter the room/ }).click();
    await expect(page).toHaveURL(/\/profile\//, { timeout: 15000 });
    await page.getByRole("navigation").getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/", { timeout: 5000 });
    await expect(page.getByRole("link", { name: /Sign in/ })).toBeVisible();
  });
});
