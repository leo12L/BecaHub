import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
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
