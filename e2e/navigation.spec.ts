import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("logo links to home", async ({ page }) => {
    await page.goto("/feed");
    await page.getByLabel("Verdict home").click();
    await expect(page).toHaveURL("/");
  });

  test("TopBar shows Feed and Search links", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Feed" })).toHaveAttribute("href", "/feed");
    await expect(nav.getByRole("link", { name: "Search" })).toHaveAttribute("href", "/search");
  });

  test("unauthenticated user sees Sign in and Get on the list", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sign in/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get on the list/ })).toBeVisible();
  });

  test("navigate to feed page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Feed" }).click();
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByText("Recent Verdicts")).toBeVisible();
  });

  test("navigate to search page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText("The Vault")).toBeVisible();
  });

  test("navigate to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Sign in/ }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Sign in")).toBeVisible();
  });

  test("navigate to signup page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Get on the list/ }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByText("Get on the list")).toBeVisible();
  });
});
