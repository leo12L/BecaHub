import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { POST } from "../route";
import { GET } from "../me/route";
import { db } from "@/lib/db";
import * as supabaseServer from "@/lib/supabase/server";

// Skip tests if DATABASE_URL is not set
const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("/api/perfil", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        id: "test-user-perfil-route",
        email: "test-perfil@example.com",
        role: "USER",
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.profile.deleteMany({ where: { userId: testUserId } });
    await db.user.delete({ where: { id: testUserId } });
  });

  describe("POST /api/perfil", () => {
    it("debe retornar 401 sin sesión", async () => {
      vi.spyOn(supabaseServer, "requireUser").mockRejectedValueOnce(
        new Error("Unauthorized"),
      );

      const request = new Request("http://localhost:3000/api/perfil", {
        method: "POST",
        body: JSON.stringify({
          academicLevel: "UNDERGRAD",
          countryInterest: "México",
        }),
      });

      const response = await POST(request as never);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("debe guardar el perfil en la base de datos", async () => {
      vi.spyOn(supabaseServer, "requireUser").mockResolvedValueOnce({
        id: testUserId,
        email: "test-perfil@example.com",
        role: "USER",
      } as never);

      const profileData = {
        academicLevel: "UNDERGRAD",
        fieldOfInterest: "Ingeniería",
        countryOrigin: "México",
        countryInterest: "Estados Unidos",
        scholarshipTypes: ["MONETARY", "TUITION"],
        language: "Español",
        situation: "Estudiante de tiempo completo",
        goals: "Completar maestría en el extranjero",
      };

      const request = new Request("http://localhost:3000/api/perfil", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      const response = await POST(request as never);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.profile).toBeDefined();
      expect(json.profile.userId).toBe(testUserId);

      // Verify it was actually saved in DB
      const savedProfile = await db.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(savedProfile).not.toBeNull();
      expect(savedProfile?.academicLevel).toBe("UNDERGRAD");
      expect(savedProfile?.fieldOfInterest).toBe("Ingeniería");
      expect(savedProfile?.scholarshipTypes).toEqual(["MONETARY", "TUITION"]);
    });
  });

  describe("GET /api/perfil/me", () => {
    it("debe retornar 401 sin sesión", async () => {
      vi.spyOn(supabaseServer, "requireUser").mockRejectedValueOnce(
        new Error("Unauthorized"),
      );

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe("Unauthorized");
    });

    it("debe retornar el perfil del usuario autenticado", async () => {
      vi.spyOn(supabaseServer, "requireUser").mockResolvedValueOnce({
        id: testUserId,
        email: "test-perfil@example.com",
        role: "USER",
      } as never);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.profile).toBeDefined();
      expect(json.profile.userId).toBe(testUserId);
    });
  });
});
