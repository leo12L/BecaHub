import { NextRequest, NextResponse } from "next/server";
// TODO: Migrar a Supabase Auth
// import { getCurrentUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Descomentar cuando se complete la migración del frontend
    // const user = await getCurrentUser();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // const profile = await db.profile.upsert({
    //   where: { userId: user.id },
    //   update: { ...body },
    //   create: { userId: user.id, ...body },
    // });

    return NextResponse.json({ success: true, profile: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
