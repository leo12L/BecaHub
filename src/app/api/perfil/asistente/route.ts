import { NextRequest, NextResponse } from "next/server";
// TODO: Migrar a Supabase Auth
// import { getCurrentUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // TODO: Descomentar cuando se complete la migración del frontend
    // const user = await getCurrentUser();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();

    // TODO: Integrar con asistente de perfil de Groq si está disponible

    return NextResponse.json({ message: "Profile assistant not yet implemented" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
