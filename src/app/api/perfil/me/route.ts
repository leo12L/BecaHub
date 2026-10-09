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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
