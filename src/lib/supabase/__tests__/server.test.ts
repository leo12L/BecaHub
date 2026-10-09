import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { getCurrentUser } from "../server";

// Mock getSupabaseServerClient para evitar el error de cookies()
vi.mock("../server", async () => {
  const actual = await vi.importActual("../server");
  return {
    ...actual,
    getSupabaseServerClient: vi.fn(),
  };
});

import { getSupabaseServerClient } from "../server";

// Skip tests if DATABASE_URL is not set
const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("getCurrentUser - legacy user linking", () => {
  const legacyUserId = "legacy-user-id-nextauth";
  const supabaseUserId = "supabase-auth-user-id";
  const testEmail = "legacy-user@example.com";

  beforeEach(async () => {
    // Clean up any existing test data
    await db.favorite.deleteMany({ where: { userId: { in: [legacyUserId, supabaseUserId] } } });
    await db.profile.deleteMany({ where: { userId: { in: [legacyUserId, supabaseUserId] } } });
    await db.user.deleteMany({ where: { id: { in: [legacyUserId, supabaseUserId] } } });
  });

  afterAll(async () => {
    // Final cleanup
    await db.favorite.deleteMany({ where: { userId: { in: [legacyUserId, supabaseUserId] } } });
    await db.profile.deleteMany({ where: { userId: { in: [legacyUserId, supabaseUserId] } } });
    await db.user.deleteMany({ where: { id: { in: [legacyUserId, supabaseUserId] } } });
  });

  it("debe conservar favoritos y perfil tras vincular usuario legacy", async () => {
    // 1. Crear usuario legacy con rol ADMIN y datos asociados
    const legacyUser = await db.user.create({
      data: {
        id: legacyUserId,
        email: testEmail,
        role: "ADMIN",
        name: "Legacy Admin",
      },
    });

    // Crear perfil del usuario legacy
    await db.profile.create({
      data: {
        userId: legacyUserId,
        academicLevel: "UNDERGRAD",
        fieldOfInterest: "Ingeniería",
      },
    });

    // Crear source y scholarship para los favoritos
    const source = await db.source.create({
      data: {
        name: "Test Source",
        url: "https://example.com",
        type: "MANUAL",
      },
    });

    const scholarship = await db.scholarship.create({
      data: {
        title: "Test Scholarship",
        slug: "test-scholarship-legacy",
        description: "Test",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/apply",
        sourceId: source.id,
      },
    });

    // Crear favorito del usuario legacy
    await db.favorite.create({
      data: {
        userId: legacyUserId,
        scholarshipId: scholarship.id,
      },
    });

    // 2. Mockear Supabase Auth con email confirmado
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: supabaseUserId,
              email: testEmail,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { name: "Legacy Admin" },
            },
          },
        }),
      },
    };
    vi.mocked(getSupabaseServerClient).mockResolvedValueOnce(mockSupabaseClient as never);

    // 3. Llamar getCurrentUser (debe vincular)
    const linkedUser = await getCurrentUser();

    // 4. Verificar que el usuario fue vinculado
    expect(linkedUser).not.toBeNull();
    expect(linkedUser?.id).toBe(supabaseUserId);
    expect(linkedUser?.email).toBe(testEmail);
    expect(linkedUser?.role).toBe("ADMIN"); // Rol preservado

    // 5. Verificar que el perfil se preservó (onUpdate: Cascade)
    const profile = await db.profile.findUnique({
      where: { userId: supabaseUserId },
    });
    expect(profile).not.toBeNull();
    expect(profile?.academicLevel).toBe("UNDERGRAD");
    expect(profile?.fieldOfInterest).toBe("Ingeniería");

    // 6. Verificar que el favorito se preservó (onUpdate: Cascade)
    const favorite = await db.favorite.findFirst({
      where: { userId: supabaseUserId, scholarshipId: scholarship.id },
    });
    expect(favorite).not.toBeNull();

    // Cleanup
    await db.favorite.delete({ where: { id: favorite!.id } });
    await db.scholarship.delete({ where: { id: scholarship.id } });
    await db.source.delete({ where: { id: source.id } });
  });

  it("debe rechazar vinculación sin correo confirmado y no heredar rol", async () => {
    // 1. Crear usuario legacy con rol ADMIN
    await db.user.create({
      data: {
        id: legacyUserId,
        email: testEmail,
        role: "ADMIN",
        name: "Legacy Admin",
      },
    });

    // 2. Mockear Supabase Auth SIN email confirmado
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: supabaseUserId,
              email: testEmail,
              email_confirmed_at: null, // Email NO confirmado
              user_metadata: {},
            },
          },
        }),
      },
    };
    vi.mocked(getSupabaseServerClient).mockResolvedValueOnce(mockSupabaseClient as never);

    // 3. getCurrentUser debe lanzar error solicitando confirmación
    await expect(getCurrentUser()).rejects.toThrow(
      /confirmar tu correo electrónico/i,
    );

    // 4. Verificar que el usuario legacy NO fue modificado
    const legacyUserAfter = await db.user.findUnique({
      where: { id: legacyUserId },
    });
    expect(legacyUserAfter).not.toBeNull();
    expect(legacyUserAfter?.id).toBe(legacyUserId); // ID no cambió
    expect(legacyUserAfter?.role).toBe("ADMIN"); // Rol no fue heredado

    // 5. Verificar que NO se creó el nuevo usuario de Supabase
    const newUser = await db.user.findUnique({
      where: { id: supabaseUserId },
    });
    expect(newUser).toBeNull();
  });
});
