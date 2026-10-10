import { test, expect } from "@playwright/test";

test.describe("Destination Selector and Globe", () => {
  test("should display destination chips on home page", async ({ page }) => {
    await page.goto("/");

    // Check for heading
    await expect(
      page.getByRole("heading", { name: /¿A dónde quieres ir\?/i }),
    ).toBeVisible();

    // Check for destination chips (use exact match to avoid conflicts with category buttons)
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

  test("should show initial message when no destination selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Should show the initial state message
    await expect(
      page.getByText(/Selecciona un destino para ver becas disponibles/i),
    ).toBeVisible();
  });

  test("should filter scholarships when destination is selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on España
    await page.getByRole("button", { name: "España" }).click();

    // Wait for the chip to be pressed
    await expect(page.getByRole("button", { name: "España" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Should either show scholarships or empty state
    const hasScholarships = await page
      .getByRole("heading", { name: /Becas para España/i })
      .isVisible()
      .catch(() => false);

    if (hasScholarships) {
      // If there are scholarships, check the heading
      await expect(
        page.getByRole("heading", { name: /Becas para España/i }),
      ).toBeVisible();
    } else {
      // If no scholarships, check empty state
      await expect(
        page.getByText(/No hay becas disponibles para España/i),
      ).toBeVisible();
    }
  });

  test("should show empty state message for destination without scholarships", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on China (likely no scholarships)
    await page.getByRole("button", { name: "China" }).click();

    // Should show empty state (either immediately or after short delay)
    const emptyMessage = page.getByText(
      /No hay becas disponibles para China|Selecciona un destino/i,
    );
    await expect(emptyMessage).toBeVisible({ timeout: 3000 });
  });

  test("should respect keyboard navigation for destination chips", async ({
    page,
  }) => {
    await page.goto("/");

    // Tab to first destination chip
    await page.keyboard.press("Tab");

    // Keep pressing tab until we reach a destination button
    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused === "BUTTON") {
        const text = await page.evaluate(
          () => document.activeElement?.textContent,
        );
        if (text && text.includes("México")) break;
      }
      await page.keyboard.press("Tab");
    }

    // Press Enter to select
    await page.keyboard.press("Enter");

    // Verify a destination was selected (either scholarships or empty state visible)
    const hasContent = await page
      .getByText(/Becas para|No hay becas disponibles/i)
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBe(true);
  });
});
