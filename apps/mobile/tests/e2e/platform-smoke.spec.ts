import { test, expect } from "@playwright/test";

/**
 * Smoke tests for security-sensitive public boundaries.
 * These tests intentionally avoid real user data and payment providers.
 */
test.describe("KinetixFitt platform smoke", () => {
  test("health endpoint exposes only the public health contract", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-cache");

    const body = await response.json();
    expect(body).toMatchObject({ status: "ok" });
    expect(typeof body.timestamp).toBe("string");
    expect(body).not.toHaveProperty("database");
    expect(body).not.toHaveProperty("environment");
    expect(body).not.toHaveProperty("uptime");
  });

  test("notification preferences require a session", async ({ request }) => {
    const get = await request.get("/api/notification-preferences");
    expect(get.status()).toBe(401);

    const post = await request.post("/api/notification-preferences", {
      data: { enabled: true, types: ["coach_message"] },
    });
    expect(post.status()).toBe(401);

    const del = await request.delete("/api/notification-preferences");
    expect(del.status()).toBe(401);
  });

  test("push subscription endpoints require a session", async ({ request }) => {
    const get = await request.get("/api/push/subscribe");
    expect(get.status()).toBe(401);

    const post = await request.post("/api/push/subscribe", {
      data: {
        subscription: {
          endpoint: "https://example.com/push/test",
          keys: { p256dh: "test-p256dh", auth: "test-auth" },
        },
      },
    });
    expect(post.status()).toBe(401);

    const del = await request.delete("/api/push/subscribe?endpoint=https%3A%2F%2Fexample.com%2Fpush%2Ftest");
    expect(del.status()).toBe(401);
  });

  test("internal push sender rejects public requests", async ({ request }) => {
    const response = await request.post("/api/push/send", {
      data: {
        userIds: ["nonexistent"],
        type: "coach_message",
        title: "test",
        body: "test",
      },
    });
    expect(response.status()).toBe(401);
  });

  test("payment webhook rejects unsigned requests", async ({ request }) => {
    const response = await request.post("/api/payments/webhook", {
      data: { type: "payment", id: "unsigned-test" },
    });
    expect([401, 500]).toContain(response.status());
  });

  test("VAPID public key endpoint never returns a private key", async ({ request }) => {
    const response = await request.get("/api/push/public-key");
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).not.toHaveProperty("privateKey");
    expect(body).not.toHaveProperty("vapidPrivateKey");
    if (response.status() === 200) expect(typeof body.publicKey).toBe("string");
  });
});
