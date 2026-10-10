import { test, expect } from "@playwright/test";

test.describe("Destination Selector", () => {
  test("should display destination chips on the catalog page", async ({
    page,
  }) => {
    await page.goto("/becas");

    await expect(page.getByText(/Filtrar por destino/i)).toBeVisible();

    await expect(
      page.getByRole("button", { name: "México", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Estados Unidos", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "España", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Europa", exact: true }),
    ).toBeVisible();
  });

  test("should filter scholarships when destination is selected", async ({
    page,
  }) => {
    await page.goto("/becas");

    await page.getByRole("button", { name: "España" }).click();

    await expect(page.getByRole("button", { name: "España" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(page).toHaveURL(/destination=ES/);

    const hasScholarships = await page
      .getByRole("heading", { name: /Becas para España/i })
      .isVisible()
      .catch(() => false);

    if (hasScholarships) {
      await expect(
        page.getByRole("heading", { name: /Becas para España/i }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText(/No hay becas disponibles para España/i),
      ).toBeVisible();
    }
  });

  test("should show empty state message for destination without scholarships", async ({
    page,
  }) => {
    await page.goto("/becas");

    await page.getByRole("button", { name: "China" }).click();

    await expect(
      page.getByText(/No hay becas disponibles para China/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should respect keyboard navigation for destination chips", async ({
    page,
  }) => {
    await page.goto("/becas");

    await page.getByRole("button", { name: "México", exact: true }).focus();
    await page.keyboard.press("Enter");

    await page.waitForSelector(
      "text=/Becas para México|No hay becas disponibles para México/i",
      { timeout: 5000 },
    );
  });
});
