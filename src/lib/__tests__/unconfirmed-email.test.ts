/**
 * Tests para manejo de correo no confirmado (Fase 3, extra QA)
 * Verifica que el login con correo no confirmado muestra mensaje claro sin 500
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCurrentUser } from "@/lib/supabase/server";
import * as supabaseServer from "@supabase/ssr";
import { db } from "@/lib/db";

// Mock de Supabase SSR
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

// Mock de next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

describe("Manejo de correo no confirmado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usuario con correo no confirmado recibe error con código EMAIL_NOT_CONFIRMED", async () => {
    const mockAuthUser = {
      id: "test-unconfirmed-user-id",
      email: "unconfirmed@example.com",
      email_confirmed_at: null, // Email NO confirmado
      user_metadata: {
        name: "Usuario No Confirmado",
      },
    };

    // Mock del cliente de Supabase
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createServerClient).mockReturnValue(mockSupabase as any);

    // Mock de db.user.findUnique para simular usuario legacy existente
    const findUniqueSpy = vi.spyOn(db.user, "findUnique");
    findUniqueSpy
      .mockResolvedValueOnce(null) // Primera llamada (buscar por ID) - no existe
      .mockResolvedValueOnce({
        // Segunda llamada (buscar por email) - existe un usuario legacy
        id: "old-legacy-id",
        email: "unconfirmed@example.com",
        name: "Usuario Legacy",
        image: null,
        emailVerified: null,
        role: "USER",
        country: null,
        academicLevel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Intentar obtener el usuario actual
    let error: Error | null = null;
    try {
      await getCurrentUser();
    } catch (e) {
      error = e as Error;
    }

    // Verificar que se lanzó un error
    expect(error).not.toBeNull();
    expect(error?.message).toContain("Debes confirmar tu correo");
    expect(error?.message).toContain("Revisa tu bandeja");

    // Verificar que el error tiene el código EMAIL_NOT_CONFIRMED
    expect((error as Error & { code?: string }).code).toBe("EMAIL_NOT_CONFIRMED");

    findUniqueSpy.mockRestore();
  });

  it("usuario con correo confirmado NO recibe error", async () => {
    const mockAuthUser = {
      id: "test-confirmed-user-id",
      email: "confirmed@example.com",
      email_confirmed_at: "2026-01-01T00:00:00.000Z", // Email SÍ confirmado
      user_metadata: {
        name: "Usuario Confirmado",
      },
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createServerClient).mockReturnValue(mockSupabase as any);

    // Mock de db.user.findUnique - usuario no existe aún
    const findUniqueSpy = vi.spyOn(db.user, "findUnique").mockResolvedValue(null);

    // Mock de db.user.create para el usuario nuevo
    const createSpy = vi.spyOn(db.user, "create").mockResolvedValue({
      id: mockAuthUser.id,
      email: mockAuthUser.email,
      name: mockAuthUser.user_metadata.name,
      image: null,
      emailVerified: new Date(mockAuthUser.email_confirmed_at),
      role: "USER",
      country: null,
      academicLevel: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Obtener el usuario actual no debe lanzar error
    const user = await getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.email).toBe(mockAuthUser.email);

    findUniqueSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("mensaje de error está en español", async () => {
    const mockAuthUser = {
      id: "test-user-spanish-message",
      email: "spanish@example.com",
      email_confirmed_at: null,
      user_metadata: {},
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createServerClient).mockReturnValue(mockSupabase as any);

    const findUniqueSpy = vi.spyOn(db.user, "findUnique");
    findUniqueSpy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "legacy-user",
        email: "spanish@example.com",
        name: null,
        image: null,
        emailVerified: null,
        role: "USER",
        country: null,
        academicLevel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    let error: Error | null = null;
    try {
      await getCurrentUser();
    } catch (e) {
      error = e as Error;
    }

    // Verificar que el mensaje está en español
    expect(error?.message).toMatch(/confirmar tu correo/i);
    expect(error?.message).toMatch(/bandeja/i);
    // No debe contener palabras en inglés
    expect(error?.message).not.toMatch(/confirm|email|inbox/i);

    findUniqueSpy.mockRestore();
  });
});
