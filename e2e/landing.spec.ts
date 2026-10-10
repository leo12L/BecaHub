import { expect, test } from "@playwright/test";
import { Client } from "pg";

test.describe("Portada BecaHub", () => {
  test("muestra el hero, las secciones de referencia y el pie", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Encuentra las becas de las que no te has enterado.",
    );
    await expect(page.locator("h1 em")).toHaveText("no");
    await expect(
      page.getByRole("link", { name: "Explorar becas →" }),
    ).toHaveAttribute("href", "/becas");
    await expect(
      page.getByRole("link", { name: "Encuentra tu beca →" }),
    ).toHaveAttribute("href", "/becas");
    await expect(
      page.getByRole("heading", { name: "Oportunidades que mereces conocer." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "El siguiente paso empieza contigo." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Encuentra lo que va contigo" }),
    ).toBeVisible();
    await expect(
      page.getByText("Más oportunidades, nuevos caminos."),
    ).toBeVisible();
    await expect(
      page.getByLabel("Pendiente: Instagram (sin URL todavía)"),
    ).toBeDisabled();
    await expect(page.getByTestId("landing-strips")).toHaveCount(0);
    await expect(page.getByTestId("stat-convocatorias")).toHaveCount(0);
  });

  test("los anclas de la barra apuntan a secciones reales", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#descubre")).toBeVisible();
    await expect(page.locator("#preparate")).toBeVisible();
    await expect(page.locator("#como-funciona")).toBeVisible();
    await expect(page.locator("#comunidad")).toBeVisible();

    for (const label of [
      "Descubre",
      "Prepárate",
      "Cómo funciona",
      "Comunidad",
    ]) {
      await expect(
        page
          .getByRole("navigation", { name: "Navegación principal" })
          .getByRole("link", { name: label }),
      ).toBeVisible();
    }
  });

  test("las fotos del hero y los carruseles cargan con naturalWidth > 0", async ({
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

      const visibleHero =
        viewport.width < 901
          ? (["a", "b", "d", "e"] as const)
          : (["a", "b", "c", "d", "e", "f", "g", "h"] as const);

      for (const slot of visibleHero) {
        const img = page.getByTestId(`landing-hero-img-${slot}`);
        await img.scrollIntoViewIfNeeded();
        await expect(img).toBeVisible();
        await expect
          .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete))
          .toBe(true);
        const naturalWidth = await img.evaluate(
          (el: HTMLImageElement) => el.naturalWidth,
        );
        expect(
          naturalWidth,
          `hero ${slot} en ${viewport.name}`,
        ).toBeGreaterThan(0);
      }

      for (const id of [
        "landing-carousel-discover-img",
        "landing-carousel-prepare-img",
      ] as const) {
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

  test("el carrusel avanza y anuncia la foto", async ({ page }) => {
    await page.goto("/");
    const carousel = page.getByTestId("landing-carousel-discover");
    await carousel.scrollIntoViewIfNeeded();
    await expect(carousel.getByText("01 / 03")).toBeVisible();
    await carousel.getByRole("button", { name: "Foto siguiente" }).click();
    await expect(carousel.getByText("02 / 03")).toBeVisible();
  });

  test("una beca PENDING_REVIEW nunca sale en la portada", async ({ page }) => {
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
        "destinationCountries", "academicLevel", "applyUrl", "sourceId",
        deadline, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, 'PENDING_REVIEW', 'MONETARY',
        ARRAY['MX']::text[], 'UNDERGRAD', $5, $6,
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

  test("prefers-reduced-motion quita la transición del carrusel", async ({
    page,
  }) => {
    await page.goto("/");
    const img = page.getByTestId("landing-carousel-discover-img");
    await img.scrollIntoViewIfNeeded();
    const transition = await img.evaluate(
      (el) => getComputedStyle(el).transition,
    );
    expect(transition === "none" || transition.includes("none")).toBe(true);
  });
});
