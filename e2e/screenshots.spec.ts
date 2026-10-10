import { test, expect } from "@playwright/test";

// Only run this spec when SCREENSHOTS=1 is set
const SCREENSHOTS_ENABLED = process.env.SCREENSHOTS === "1";

test.describe("Visual Screenshots", () => {
  test.skip(!SCREENSHOTS_ENABLED, "Screenshots only run when SCREENSHOTS=1");

  test.beforeAll(async () => {
    // Import db dynamically to avoid ES module issues
    const { db } = await import("../src/lib/db.js");

    // Create test scholarships for screenshots
    const manualSource = await db.source.findFirst({
      where: { name: "Curación manual (admin)" },
    });

    if (!manualSource) {
      throw new Error("Manual source not found");
    }

    const scholarships = [
      {
        slug: "beca-mexico-screenshot",
        title: "Beca de Licenciatura en México",
        description:
          "Programa de apoyo para estudiantes mexicanos en instituciones nacionales.",
        status: "ACTIVE" as const,
        coverageType: "FULL" as const,
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD" as const,
        deadline: new Date("2027-06-30"),
        applyUrl: "https://ejemplo.mx/becas",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "fulbright-usa-screenshot",
        title: "Maestría en Estados Unidos - Fulbright",
        description: "Beca completa para posgrado en universidades estadounidenses.",
        status: "ACTIVE" as const,
        coverageType: "FULL" as const,
        destinationCountries: ["US"],
        academicLevel: "GRAD" as const,
        deadline: new Date("2027-03-15"),
        applyUrl: "https://ejemplo.com/fulbright",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "doctorado-espana-screenshot",
        title: "Doctorado en España - MAEC",
        description: "Programa de becas para doctorado en España.",
        status: "ACTIVE" as const,
        coverageType: "FULL" as const,
        destinationCountries: ["ES"],
        academicLevel: "PHD" as const,
        deadline: new Date("2027-01-31"),
        applyUrl: "https://ejemplo.es/becas",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "alemania-daad-screenshot",
        title: "Intercambio en Alemania - DAAD",
        description: "Programa de intercambio en universidades alemanas.",
        status: "ACTIVE" as const,
        coverageType: "MONETARY" as const,
        destinationCountries: ["DE"],
        academicLevel: "UNDERGRAD" as const,
        deadline: new Date("2026-12-15"),
        applyUrl: "https://ejemplo.de/daad",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "china-cgs-screenshot",
        title: "Posgrado en China - CSC",
        description: "Beca del gobierno chino para estudiantes internacionales.",
        status: "ACTIVE" as const,
        coverageType: "FULL" as const,
        destinationCountries: ["CN"],
        academicLevel: "GRAD" as const,
        deadline: new Date("2027-04-30"),
        applyUrl: "https://ejemplo.cn/scholarships",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "investigacion-sin-destino",
        title: "Beca de Investigación Global",
        description: "Programa sin destino específico definido.",
        status: "ACTIVE" as const,
        coverageType: "RESEARCH" as const,
        destinationCountries: [],
        academicLevel: "PHD" as const,
        deadline: new Date("2027-08-31"),
        applyUrl: "https://ejemplo.org/research",
        sourceId: manualSource.id,
        isVerified: true,
      },
      {
        slug: "cierra-pronto",
        title: "Beca que Cierra Pronto",
        description: "Convocatoria con deadline cercano.",
        status: "ACTIVE" as const,
        coverageType: "TUITION" as const,
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD" as const,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        applyUrl: "https://ejemplo.mx/urgente",
        sourceId: manualSource.id,
        isVerified: true,
      },
    ];

    for (const scholarship of scholarships) {
      await db.scholarship.upsert({
        where: { slug: scholarship.slug },
        create: scholarship,
        update: scholarship,
      });
    }
  });

  test.afterAll(async () => {
    // Import db dynamically
    const { db } = await import("../src/lib/db.js");

    // Clean up test scholarships
    await db.scholarship.deleteMany({
      where: {
        slug: {
          in: [
            "beca-mexico-screenshot",
            "fulbright-usa-screenshot",
            "doctorado-espana-screenshot",
            "alemania-daad-screenshot",
            "china-cgs-screenshot",
            "investigacion-sin-destino",
            "cierra-pronto",
          ],
        },
      },
    });
  });

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
