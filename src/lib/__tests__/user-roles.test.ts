import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";

// Skip si DATABASE_URL no está configurada
const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("User roles - MODERATOR enum", () => {
  const testUserId = "test-moderator-user-id";
  const testEmail = "moderator@test.com";

  beforeEach(async () => {
    // Limpiar usuario de prueba si existe
    await db.user.deleteMany({ where: { id: testUserId } });
  });

  afterEach(async () => {
    // Limpiar usuario de prueba
    await db.user.deleteMany({ where: { id: testUserId } });
  });

  it("debe crear y leer un usuario con rol MODERATOR", async () => {
    // 1. Crear usuario con rol MODERATOR
    const createdUser = await db.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        role: "MODERATOR",
      },
    });

    expect(createdUser.role).toBe("MODERATOR");

    // 2. Leer el usuario de la base de datos
    const fetchedUser = await db.user.findUnique({
      where: { id: testUserId },
    });

    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.role).toBe("MODERATOR");
  });

  it("debe actualizar un usuario de USER a MODERATOR", async () => {
    // 1. Crear usuario con rol USER
    await db.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        role: "USER",
      },
    });

    // 2. Actualizar a MODERATOR
    const updatedUser = await db.user.update({
      where: { id: testUserId },
      data: { role: "MODERATOR" },
    });

    expect(updatedUser.role).toBe("MODERATOR");

    // 3. Verificar que se guardó correctamente
    const fetchedUser = await db.user.findUnique({
      where: { id: testUserId },
    });

    expect(fetchedUser?.role).toBe("MODERATOR");
  });

  it("debe filtrar usuarios por rol MODERATOR", async () => {
    // 1. Crear varios usuarios con diferentes roles
    await db.user.createMany({
      data: [
        { id: `${testUserId}-1`, email: `${testUserId}-1@test.com`, role: "USER" },
        { id: `${testUserId}-2`, email: `${testUserId}-2@test.com`, role: "MODERATOR" },
        { id: `${testUserId}-3`, email: `${testUserId}-3@test.com`, role: "ADMIN" },
        { id: `${testUserId}-4`, email: `${testUserId}-4@test.com`, role: "MODERATOR" },
      ],
    });

    // 2. Buscar solo MODERATORS
    const moderators = await db.user.findMany({
      where: { 
        role: "MODERATOR",
        id: { startsWith: testUserId },
      },
    });

    expect(moderators).toHaveLength(2);
    expect(moderators.every(u => u.role === "MODERATOR")).toBe(true);

    // Cleanup
    await db.user.deleteMany({
      where: { id: { startsWith: testUserId } },
    });
  });
});
