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

  // Special screenshots for new features (light mode only)
  test("Globe with Spain selected - desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click on Spain destination chip
    const spainButton = page.getByRole("button", { name: "España", exact: true });
    await expect(spainButton).toBeVisible();
    await spainButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: "screenshots/05-globe-spain-desktop-light.png",
      fullPage: true,
    });
  });

  test("Globe with Spain selected - mobile light", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const spainButton = page.getByRole("button", { name: "España", exact: true });
    await expect(spainButton).toBeVisible();
    await spainButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: "screenshots/05-globe-spain-mobile-light.png",
      fullPage: true,
    });
  });

  test("Empty state - desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Try to find a destination button that should have no scholarships (Japan)
    const japanButton = page.getByRole("button", { name: /jap[óo]n/i });
    if (await japanButton.count() > 0) {
      await japanButton.click();
      await page.waitForTimeout(1500);
    } else {
      // If Japan button doesn't exist, just screenshot home with no filter
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: "screenshots/06-empty-state-desktop-light.png",
      fullPage: true,
    });
  });

  test("Carousel visible - desktop light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "screenshots/07-carousel-desktop-light.png",
      fullPage: true,
    });
  });

  test("Carousel visible - mobile light", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "screenshots/07-carousel-mobile-light.png",
      fullPage: true,
    });
  });
});
