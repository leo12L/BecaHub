import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { filtroBecaPublica } from "@/lib/becas/publica";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const scholarships = await db.scholarship.findMany({
    where: filtroBecaPublica(),
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/becas`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const becaRoutes: MetadataRoute.Sitemap = scholarships.map((beca) => ({
    url: `${SITE_URL}/becas/${beca.slug}`,
    lastModified: beca.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...becaRoutes];
}
