import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/planes"];

test.describe("runtime smoke", () => {
  test("public routes render without console/page errors or 4xx/5xx resources", async ({ page }) => {
    const errors: string[] = [];
    const badResponses: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => {
      errors.push(`PAGEERROR: ${error.message}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        badResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const route of PUBLIC_ROUTES) {
      errors.length = 0;
      badResponses.length = 0;

      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status(), `route ${route}`).toBe(200);

      const primaryContent = route === "/" || route === "/planes" ? page.locator("h1").first() : page.locator("form").first();
      await expect(primaryContent).toBeVisible();

      const hydrationErrors = errors.filter((message) =>
        /hydration|didn't match|did not match|hydration mismatch/i.test(message),
      );
      expect(hydrationErrors, `hydration errors on ${route}`).toEqual([]);
      expect(badResponses, `bad resources on ${route}`).toEqual([]);
      expect(errors, `console/page errors on ${route}`).toEqual([]);
    }
  });
});
