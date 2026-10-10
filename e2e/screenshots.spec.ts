import { test, expect } from "@playwright/test";

// Only run this spec when SCREENSHOTS=1 is set
const SCREENSHOTS_ENABLED = process.env.SCREENSHOTS === "1";

test.describe("Visual Screenshots", () => {
  test.skip(!SCREENSHOTS_ENABLED, "Screenshots only run when SCREENSHOTS=1");

  const viewports = [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  const themes: Array<"light" | "dark"> = ["light", "dark"];

  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`Home page - ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `screenshots/01-home-${viewport.name}-${theme}.png`,
          fullPage: true,
        });
      });

      test(`Catalog page - ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/becas");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `screenshots/02-catalog-${viewport.name}-${theme}.png`,
          fullPage: true,
        });
      });

      test(`Detail page - ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/becas/beca-mexico-screenshot");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `screenshots/03-detail-${viewport.name}-${theme}.png`,
          fullPage: true,
        });
      });

      test(`Login page - ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/login");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `screenshots/04-login-${viewport.name}-${theme}.png`,
          fullPage: true,
        });
      });
    }
  }

  test("Destination filter Spain - desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/becas");
    await page.waitForLoadState("networkidle");

    const spainButton = page.getByRole("button", { name: "España", exact: true });
    await expect(spainButton).toBeVisible();
    await spainButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: "screenshots/05-destination-spain-desktop-light.png",
      fullPage: true,
    });
  });

  test("Empty destination state - desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/becas");
    await page.waitForLoadState("networkidle");

    const chinaButton = page.getByRole("button", { name: "China", exact: true });
    await expect(chinaButton).toBeVisible();
    await chinaButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: "screenshots/06-empty-state-desktop-light.png",
      fullPage: true,
    });
  });
});
