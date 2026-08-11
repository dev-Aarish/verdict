import { test, expect } from "@playwright/test";

test.describe("Sitemap", () => {
  test("returns valid XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<?xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
  });

  test("contains expected routes", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/feed");
    expect(body).toContain("/profile/");
    expect(body).toContain("/verdict/");
    expect(body).toContain("/share/");
  });

  test("has cache header", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.headers()["cache-control"]).toContain("public");
  });
});
