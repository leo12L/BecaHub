import { NextResponse } from "next/server";
// TODO: Migrar a Supabase Auth
// import { getCurrentUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // TODO: Descomentar cuando se complete la migración del frontend
    // const user = await getCurrentUser();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // const profile = await db.profile.findUnique({
    //   where: { userId: user.id },
    // });

    return NextResponse.json({ profile: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
