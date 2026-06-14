import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recomendarBecas } from "@/lib/becas/recommend";
import { academicLevelValues } from "@/validators/becas.validator";
import { formatAmount, getDeadlineInfo } from "@/lib/becas/format";

const profileSchema = z.object({
  academicLevel:   z.enum(academicLevelValues).optional(),
  countryInterest: z.string().min(1).optional(),
  scholarshipTypes: z.string().optional(), // comma-separated CoverageType values
  language:        z.string().min(1).optional(),
  limit:           z.coerce.number().int().min(1).max(20).default(6),
});

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const { limit, scholarshipTypes: typesStr, ...rest } = parsed.data;
  const scholarshipTypes = typesStr
    ? typesStr.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  const becas = await recomendarBecas({ ...rest, scholarshipTypes }, limit);

  const data = becas.map((b) => ({
    id:          b.id,
    slug:        b.slug,
    title:       b.title,
    description: b.description,
    country:     b.countryDestination,
    applyUrl:    b.applyUrl,
    isVerified:  b.isVerified,
    deadline:    getDeadlineInfo(b.deadline, b.status).label,
    amount:      formatAmount(b.amountMin, b.amountMax, b.currency),
  }));

  return NextResponse.json({ data });
}
