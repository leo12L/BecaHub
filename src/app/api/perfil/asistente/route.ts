import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { profileAssistantRequestSchema } from "@/validators/profile-assistant.validator";
import {
  chatWithAssistant,
  AiUnavailableError,
  AiParseError,
} from "@/lib/ai/profile-assistant";

/**
 * Siguiente turno del asistente conversacional de perfil (Groq). Recibe el
 * historial completo de la conversación y devuelve la respuesta del
 * asistente, más el perfil estructurado propuesto cuando ya hay suficiente
 * información (`profileReady: true`).
 *
 * Requiere sesión de usuario autenticado.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Se requiere autenticación" },
      { status: 401 },
    );
  }
  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = profileAssistantRequestSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  try {
    const turn = await chatWithAssistant(body.messages);
    return NextResponse.json(turn);
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return NextResponse.json(
        {
          error:
            "El asistente no está disponible; puedes llenar tu perfil manualmente.",
        },
        { status: 503 },
      );
    }
    if (error instanceof AiParseError || error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            "El asistente no pudo responder correctamente; intenta de nuevo o llena tu perfil manualmente.",
        },
        { status: 422 },
      );
    }
    throw error;
  }
}
