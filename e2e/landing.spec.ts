import { expect, test } from "@playwright/test";
import { Client } from "pg";

test.describe("Portada BecaHub", () => {
  test("muestra el hero, la línea de tiempo y el pie con redes pendientes", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Encuentra las becas de las que no te has enterado",
    );
    await expect(
      page.getByText("BecaHub", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cómo funciona" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Creas tu cuenta y perfil" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Pendiente: Instagram (sin URL todavía)"),
    ).toBeDisabled();
    await expect(page.getByTestId("landing-strips")).toBeVisible();
  });

  test("las tarjetas de ejemplo no se pueden abrir, no se enfocan y no cuentan", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("stat-convocatorias")).toHaveText("0");

    const examples = page.locator('[data-landing-card="example"]');
    await expect(examples.first()).toBeVisible();
    await expect(page.locator("a[data-landing-card='example']")).toHaveCount(0);
    await expect(page.locator('[data-landing-card="example"] a')).toHaveCount(
      0,
    );

    const originalExamples = page.locator(
      '[data-landing-card="example"][data-strip-copy="original"]',
    );
    const count = await originalExamples.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = originalExamples.nth(i);
      await expect(card).toHaveAttribute("aria-hidden", "true");
      await expect(card).toContainText("Ejemplo");
      const href = await card.getAttribute("href");
      expect(href).toBeNull();
      const tabIndex = await card.getAttribute("tabindex");
      expect(tabIndex === null || tabIndex === "-1").toBe(true);
    }

    await page.locator("body").press("Tab");
    await page.locator("body").press("Tab");
    await page.locator("body").press("Tab");
    await page.locator("body").press("Tab");
    await page.locator("body").press("Tab");
    const focusedIsExample = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      return Boolean(
        el.closest("[data-landing-card='example']") ||
        (el as HTMLElement).dataset.landingCard === "example",
      );
    });
    expect(focusedIsExample).toBe(false);
  });

  test("ambas fotos de los bloques cargan con naturalWidth > 0", async ({
    page,
  }) => {
    const cases = [
      { name: "compu-claro", width: 1440, height: 900, dark: false },
      { name: "compu-oscuro", width: 1440, height: 900, dark: true },
      { name: "celular-claro", width: 390, height: 844, dark: false },
      { name: "celular-oscuro", width: 390, height: 844, dark: true },
    ] as const;

    for (const viewport of cases) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");
      await page.evaluate((dark) => {
        document.documentElement.classList.toggle("dark", dark);
      }, viewport.dark);

      const ids = ["landing-photo-colaborando", "landing-photo-aula"] as const;
      for (const id of ids) {
        const img = page.getByTestId(id);
        await img.scrollIntoViewIfNeeded();
        await expect(img).toBeVisible();
        await expect
          .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete))
          .toBe(true);
        const naturalWidth = await img.evaluate(
          (el: HTMLImageElement) => el.naturalWidth,
        );
        expect(naturalWidth, `${id} en ${viewport.name}`).toBeGreaterThan(0);
      }
    }
  });

  test("las tiras del hero van a los lados, en diagonal, una sube y otra baja", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-strips")).toBeVisible();
    await expect(page.locator("[data-landing-strip]")).toHaveCount(4);

    const left = page.locator('[data-landing-cluster="left"]');
    const right = page.locator('[data-landing-cluster="right"]');
    await expect(left.locator("[data-landing-strip]")).toHaveCount(2);
    await expect(right.locator("[data-landing-strip]")).toHaveCount(2);
    await expect(left.locator('[data-direction="up"]')).toHaveCount(1);
    await expect(left.locator('[data-direction="down"]')).toHaveCount(1);
    await expect(right.locator('[data-direction="up"]')).toHaveCount(1);
    await expect(right.locator('[data-direction="down"]')).toHaveCount(1);

    const heading = page.getByRole("heading", { level: 1 });
    const headingBox = await heading.boundingBox();
    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    expect(headingBox).toBeTruthy();
    expect(leftBox).toBeTruthy();
    expect(rightBox).toBeTruthy();
    const headingCenter = headingBox!.x + headingBox!.width / 2;
    expect(leftBox!.x + leftBox!.width / 2).toBeLessThan(headingCenter);
    expect(rightBox!.x + rightBox!.width / 2).toBeGreaterThan(headingCenter);

    for (const cluster of [left, right]) {
      const degrees = await cluster.evaluate((el) => {
        const { transform } = getComputedStyle(el);
        const matrix = new DOMMatrix(transform);
        return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
      });
      expect(Math.abs(degrees)).toBeGreaterThan(15);
    }
  });

  test("los duplicados de las tiras están ocultos al lector de pantalla", async ({
    page,
  }) => {
    await page.goto("/");

    const duplicates = page.locator('[data-strip-copy="duplicate"]');
    await expect(duplicates.first()).toBeAttached();
    const count = await duplicates.count();
    for (let i = 0; i < count; i++) {
      await expect(duplicates.nth(i)).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("una beca PENDING_REVIEW nunca sale en las tiras", async ({ page }) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const pendingTitle = "Beca PENDING_REVIEW no debe salir en tiras XYZ";
    const sourceId = "e2e-source-landing";

    await client.query(
      `INSERT INTO "Source" (id, name, url, type, "isActive", "createdAt")
       VALUES ($1, $2, $3, 'MANUAL', true, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [sourceId, "Fuente e2e portada", "https://example.com/e2e-landing"],
    );

    await client.query(
      `INSERT INTO "Scholarship" (
        id, title, slug, description, status, "coverageType",
        "countryDestination", "academicLevel", "applyUrl", "sourceId",
        deadline, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, 'PENDING_REVIEW', 'MONETARY',
        'México', 'UNDERGRAD', $5, $6,
        $7, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET status = 'PENDING_REVIEW', title = EXCLUDED.title`,
      [
        "e2e-pending-landing",
        pendingTitle,
        "e2e-pending-landing",
        "No debe verse en la portada",
        "https://example.com/pending-landing",
        sourceId,
        "2027-12-31T00:00:00.000Z",
      ],
    );

    try {
      await page.goto("/");
      await expect(page.getByText(pendingTitle)).toHaveCount(0);
      await expect(page.locator("text=En revisión")).toHaveCount(0);
      await expect(page.getByTestId("stat-convocatorias")).toHaveText("0");
    } finally {
      await client.query(`DELETE FROM "Scholarship" WHERE id = $1`, [
        "e2e-pending-landing",
      ]);
      await client.query(`DELETE FROM "Source" WHERE id = $1`, [sourceId]);
      await client.end();
    }
  });
});

test.describe("Portada con reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("prefers-reduced-motion detiene las animaciones de tiras y fotos", async ({
    page,
  }) => {
    await page.goto("/");

    const stripAnimation = await page
      .locator("[data-landing-strip]")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(stripAnimation === "none" || stripAnimation === "").toBe(true);

    const photoAnimation = await page
      .locator("[data-landing-photo]")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(photoAnimation === "none" || photoAnimation === "").toBe(true);
  });
});
