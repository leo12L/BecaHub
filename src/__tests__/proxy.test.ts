import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";

// Mock de createServerClient de Supabase
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

// Mock de db
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db";

describe("proxy - Admin route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  describe("Usuario sin sesión", () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as never);
    });

    it("debe redirigir a /admin/login cuando se accede a /admin", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/admin"),
      );
      const response = await proxy(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("debe retornar 401 cuando se accede a /api/admin", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/admin/becas"),
      );
      const response = await proxy(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });
  });

  describe("Usuario con rol USER (sin privilegios)", () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123", email: "user@example.com" } },
          }),
        },
      } as never);

      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "USER",
      } as never);
    });

    it("debe retornar 403 cuando se accede a /admin", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/admin"),
      );
      const response = await proxy(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe("Forbidden");
    });

    it("debe retornar 403 cuando se accede a /api/admin/becas", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/admin/becas"),
      );
      const response = await proxy(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe("Forbidden");
    });
  });

  describe("Usuario con rol MODERATOR", () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "mod-123", email: "mod@example.com" } },
          }),
        },
      } as never);

      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "MODERATOR",
      } as never);
    });

    it("debe permitir acceso a /admin", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/admin"),
      );
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });

    it("debe permitir acceso a /api/admin/becas", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/admin/becas"),
      );
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });
  });

  describe("Usuario con rol ADMIN", () => {
    beforeEach(() => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-123", email: "admin@example.com" } },
          }),
        },
      } as never);

      vi.mocked(db.user.findUnique).mockResolvedValue({
        role: "ADMIN",
      } as never);
    });

    it("debe permitir acceso a /admin", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/admin"),
      );
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });

    it("debe permitir acceso a /api/admin/becas", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/admin/becas"),
      );
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });
  });

  describe("/dashboard protection", () => {
    it("debe redirigir a /login cuando no hay sesión", async () => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as never);

      const request = new NextRequest(
        new URL("http://localhost:3000/dashboard"),
      );
      const response = await proxy(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/login");
    });

    it("debe permitir acceso cuando hay sesión y email confirmado", async () => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-123",
                email: "user@example.com",
                email_confirmed_at: "2026-01-01T00:00:00.000Z",
              },
            },
          }),
        },
      } as never);

      const request = new NextRequest(
        new URL("http://localhost:3000/dashboard"),
      );
      const response = await proxy(request);

      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
    });
  });
});
