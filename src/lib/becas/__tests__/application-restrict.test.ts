import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { MENSAJE_BECA_CON_POSTULACIONES } from "@/lib/becas/admin";
import { DELETE } from "@/app/api/admin/becas/[id]/route";

const PREFIX = "restrict-app-qa-";

describe("Application.scholarshipId Restrict", () => {
  afterEach(async () => {
    await db.application.deleteMany({
      where: { userId: { startsWith: PREFIX } },
    });
    await db.scholarship.deleteMany({
      where: { slug: { startsWith: PREFIX } },
    });
    await db.source.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });
    await db.user.deleteMany({
      where: { id: { startsWith: PREFIX } },
    });
  });

  async function fixture() {
    const user = await db.user.create({
      data: {
        id: `${PREFIX}user-${Date.now()}`,
        email: `${PREFIX}${Date.now()}@example.com`,
        role: "USER",
      },
    });
    const source = await db.source.create({
      data: {
        name: `${PREFIX}source`,
        url: `https://example.com/${PREFIX}${Date.now()}`,
        type: "MANUAL",
      },
    });
    const scholarship = await db.scholarship.create({
      data: {
        title: "Beca restrict",
        slug: `${PREFIX}${Date.now()}`,
        description: "test",
        applyUrl: "https://example.com/restrict",
        deadline: new Date("2030-12-31"),
        status: "ACTIVE",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: source.id,
        destinationCountries: ["MX"],
      },
    });
    const application = await db.application.create({
      data: {
        userId: user.id,
        scholarshipId: scholarship.id,
        status: "INTERESTED",
      },
    });
    return { user, source, scholarship, application };
  }

  it("borrar una beca con postulación falla en BD (falla si el FK vuelve a Cascade)", async () => {
    const { scholarship, application } = await fixture();

    await expect(
      db.scholarship.delete({ where: { id: scholarship.id } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    expect(
      await db.application.findUnique({ where: { id: application.id } }),
    ).not.toBeNull();
    expect(
      await db.scholarship.findUnique({ where: { id: scholarship.id } }),
    ).not.toBeNull();
  });

  it("DELETE admin responde el mensaje, no 500, y la postulación sigue", async () => {
    const { scholarship, application } = await fixture();

    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/becas/x"),
      {
        params: Promise.resolve({ id: scholarship.id }),
      },
    );
    const body = (await res.json()) as { error?: string };

    expect(res.status).toBe(409);
    expect(res.status).not.toBe(500);
    expect(body.error).toBe(MENSAJE_BECA_CON_POSTULACIONES);
    expect(
      await db.application.findUnique({ where: { id: application.id } }),
    ).not.toBeNull();
    expect(
      await db.scholarship.findUnique({ where: { id: scholarship.id } }),
    ).not.toBeNull();
  });

  it("borrar el usuario con postulaciones sí funciona y no deja huérfanas (LFPDPPP)", async () => {
    const { user, application, scholarship } = await fixture();

    await db.user.delete({ where: { id: user.id } });

    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(
      await db.application.findUnique({ where: { id: application.id } }),
    ).toBeNull();
    expect(
      await db.application.findMany({ where: { userId: user.id } }),
    ).toEqual([]);
    expect(
      await db.scholarship.findUnique({ where: { id: scholarship.id } }),
    ).not.toBeNull();
  });
});
