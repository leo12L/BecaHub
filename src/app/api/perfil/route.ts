import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const profile = await db.profile.upsert({
      where: { userId: user.id },
      update: {
        academicLevel: body.academicLevel || null,
        fieldOfInterest: body.fieldOfInterest || null,
        countryOrigin: body.countryOrigin || null,
        countryInterest: body.countryInterest || null,
        scholarshipTypes: body.scholarshipTypes || [],
        language: body.language || null,
        situation: body.situation || null,
        goals: body.goals || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        academicLevel: body.academicLevel || null,
        fieldOfInterest: body.fieldOfInterest || null,
        countryOrigin: body.countryOrigin || null,
        countryInterest: body.countryInterest || null,
        scholarshipTypes: body.scholarshipTypes || [],
        language: body.language || null,
        situation: body.situation || null,
        goals: body.goals || null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
