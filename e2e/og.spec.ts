import { test, expect } from "@playwright/test";
import { makeUser, signup } from "./helpers";

test.describe("Open Graph image", () => {
  test("returns a PNG for an existing user", async ({ page, request }) => {
    const user = makeUser("og_user");
    await signup(page, user);

    const res = await request.get(`/og/${user.username}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("returns 404 for a non-existent user", async ({ request }) => {
    const res = await request.get("/og/thisuserdoesnotexist12345");
    expect(res.status()).toBe(404);
  });
});