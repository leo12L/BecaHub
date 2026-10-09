import { test, expect } from "@playwright/test";

test.describe("Admin access control", () => {
  test("non-authenticated user is redirected to /admin/login when accessing /admin", async ({
    page,
  }) => {
    const response = await page.goto("/admin");

    // Debe redirigir a /admin/login
    await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/admin/login");
  });

  test("non-authenticated user is redirected to /admin/login when accessing /admin/becas", async ({
    page,
  }) => {
    const response = await page.goto("/admin/becas");

    // Debe redirigir a /admin/login
    await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/admin/login");
  });

  test("can access /admin/login without authentication", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/login/);

    // Verificar que la página de login carga correctamente
    await expect(
      page.getByRole("heading", { name: /Panel de administración/i }),
    ).toBeVisible();
  });

  test("non-authenticated API request to /api/admin returns 401", async ({
    request,
  }) => {
    const response = await request.get("/api/admin/becas");
    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });
});
