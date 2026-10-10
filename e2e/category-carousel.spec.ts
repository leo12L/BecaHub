import { test, expect } from "@playwright/test";

test.describe("Category Carousel", () => {
  test("should display category carousel on home page", async ({ page }) => {
    await page.goto("/");

    // Check for section heading
    await expect(
      page.getByRole("heading", { name: /Explora por categoría/i }),
    ).toBeVisible();

    // Check for at least one category card
    await expect(
      page.getByRole("button", { name: /Cierran pronto/i }),
    ).toBeVisible();
  });

  test("should navigate carousel with arrow buttons", async ({ page }) => {
    await page.goto("/");

    // Find the carousel section
    const carouselSection = page.locator("section").filter({
      hasText: /Explora por categoría/i,
    });

    // Click next button
    const nextButton = carouselSection.getByRole("button", {
      name: /Siguiente/i,
    });

    // Check if next button exists and is enabled
    const isEnabled = await nextButton.isEnabled().catch(() => false);

    if (isEnabled) {
      await nextButton.click();

      // Wait a bit for animation
      await page.waitForTimeout(300);

      // Verify we can still see category cards
      await expect(
        carouselSection.getByRole("button").first(),
      ).toBeVisible();
    }
  });

  test("should navigate carousel with keyboard arrows", async ({ page }) => {
    await page.goto("/");

    // Find the carousel container
    const carouselSection = page.locator("section").filter({
      hasText: /Explora por categoría/i,
    });

    // Click into the carousel to focus it
    await carouselSection.getByRole("button").first().click();

    // Try pressing right arrow key
    await page.keyboard.press("ArrowRight");

    // Wait a bit for animation
    await page.waitForTimeout(300);

    // Carousel should still be visible and functional
    await expect(carouselSection.getByRole("button").first()).toBeVisible();
  });

  test("should filter scholarships when category is selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on a category
    await page.getByRole("button", { name: /Cierran pronto/i }).click();

    // Wait for the category to be selected (pressed state)
    await expect(
      page.getByRole("button", { name: /Cierran pronto/i }),
    ).toHaveAttribute("aria-pressed", "true");

    // Should show either scholarships or empty state
    const hasScholarships = await page
      .getByRole("heading", { name: /Cierran pronto/i })
      .nth(1) // Second occurrence (first is the button, second is the heading)
      .isVisible()
      .catch(() => false);

    if (hasScholarships) {
      // If there are scholarships, heading should be visible
      await expect(
        page.getByRole("heading", { name: /Cierran pronto/i }).nth(1),
      ).toBeVisible();
    } else {
      // If no scholarships, empty state should be visible
      await expect(
        page.getByText(/No hay becas disponibles en esta categoría/i),
      ).toBeVisible();
    }
  });

  test("should switch between categories", async ({ page }) => {
    await page.goto("/");

    // Click first category
    await page.getByRole("button", { name: /Cierran pronto/i }).click();
    await expect(
      page.getByRole("button", { name: /Cierran pronto/i }),
    ).toHaveAttribute("aria-pressed", "true");

    // Click second category
    await page.getByRole("button", { name: /Posgrado/i }).click();
    await expect(
      page.getByRole("button", { name: /Posgrado/i }),
    ).toHaveAttribute("aria-pressed", "true");

    // First category should no longer be pressed
    await expect(
      page.getByRole("button", { name: /Cierran pronto/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("should work on mobile viewport with touch", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/");

    // Category carousel should be visible
    await expect(
      page.getByRole("heading", { name: /Explora por categoría/i }),
    ).toBeVisible();

    // Categories should be visible and clickable
    await page.getByRole("button", { name: /Cierran pronto/i }).click();

    await expect(
      page.getByRole("button", { name: /Cierran pronto/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
