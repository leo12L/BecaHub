import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAdminScraperRequest } from "@/lib/admin-auth";
import { parseBecaSchema } from "@/validators/ai.validator";
import {
  parseScholarshipText,
  AiUnavailableError,
  AiParseError,
} from "@/lib/ai/parse-scholarship";

export async function POST(request: NextRequest) {
  if (!isAdminScraperRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = parseBecaSchema.parse(json);
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
    const data = await parseScholarshipText(body.text);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return NextResponse.json(
        {
          error:
            "El servicio de parseo IA no está disponible; completa el formulario manualmente.",
        },
        { status: 503 },
      );
    }
    if (error instanceof AiParseError || error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            "El parseo automático no funcionó; completa el formulario manualmente.",
        },
        { status: 422 },
      );
    }
    throw error;
  }
}
