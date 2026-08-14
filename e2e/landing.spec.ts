import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads with correct title and hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Verdict/);
    await expect(page.getByText("Everyone's a critic")).toBeVisible();
    await expect(page.getByRole("link", { name: /Get your Verdict/ }).first()).toBeVisible();
  });

  test("shows TopBar with nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get on the list/ })).toBeVisible();
  });

  test("signup CTA navigates to signup page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Get your Verdict/ }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("heading", { name: "Get on the list" })).toBeVisible();
  });

  test("example profile link navigates to a profile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /See an example profile/ }).click();
    await expect(page).toHaveURL(/\/profile\/testuser/);
  });

  test("how it works section is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Log the films")).toBeVisible();
    await expect(page.getByText("Receive the score")).toBeVisible();
    await expect(page.getByText("Collect Verdicts")).toBeVisible();
  });
});
