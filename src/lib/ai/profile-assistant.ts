import { ZodError } from "zod";
import { CoverageType, AcademicLevel } from "@/generated/prisma/enums";
import {
  assistantTurnSchema,
  type AssistantTurn,
  type ChatMessage,
} from "@/validators/profile-assistant.validator";

const GROQ_TIMEOUT_MS = 30_000;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Asistente conversacional de perfil del estudiante. Reemplaza al antiguo
 * `parse-scholarship.ts`: Groq ya no toca el pipeline de becas (eso ahora lo
 * hace Tavily sin LLM, ver `src/scrapers/discovery/`). Aquí Groq solo
 * conversa con el estudiante para entender su situación y, cuando hay
 * suficiente información, propone un perfil estructurado.
 */
const SYSTEM_PROMPT = `Eres un asistente que ayuda a estudiantes mexicanos a encontrar becas. Conversas en español, de forma clara y amable.

Tu objetivo es entender al estudiante para poder armar su perfil:
- academicLevel: nivel académico actual o al que aspira (${Object.values(AcademicLevel).join(", ")}).
- fieldOfInterest: área o carrera de interés (texto libre, ej. "ingeniería", "artes", "medicina").
- countryOrigin: país de origen del estudiante.
- countryInterest: país donde quiere estudiar.
- scholarshipTypes: tipos de beca que le interesan o le convienen, de entre: ${Object.values(CoverageType).join(", ")}.
- language: idioma preferido para sus estudios (ej. "es", "en").
- situation: resumen breve de su situación (socioeconómica, primera generación, trabaja y estudia, etc.).
- goals: sus metas (qué quiere lograr con la beca).

Reglas:
- Haz UNA pregunta a la vez, de forma natural. No interrogues con listas.
- Da consejos breves y concretos cuando aporten valor (ej. "por tu situación, podrías calificar para becas de manutención").
- No inventes datos que el estudiante no haya dado.
- Cuando ya tengas suficiente información para al menos 3-4 de los campos del perfil, marca "profileReady": true y llena "profile" con lo que sepas (usa null en lo que no sepas, y [] si no hay tipos de beca claros).
- Si "profileReady" es false, "profile" debe ser null.
- "reply" es lo que le dices al estudiante (tu pregunta o consejo). Nunca incluyas JSON dentro de "reply".

Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional ni bloques de markdown, con esta forma exacta:
{
  "reply": string,
  "profileReady": boolean,
  "profile": null | {
    "academicLevel": string | null,
    "fieldOfInterest": string | null,
    "countryOrigin": string | null,
    "countryInterest": string | null,
    "scholarshipTypes": string[],
    "language": string | null,
    "situation": string | null,
    "goals": string | null
  }
}`;

/** JSON Schema para `response_format: { type: "json_schema" }` de Groq (modo strict). */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    profileReady: { type: "boolean" },
    profile: {
      type: ["object", "null"],
      properties: {
        academicLevel: {
          type: ["string", "null"],
          enum: [...Object.values(AcademicLevel), null],
        },
        fieldOfInterest: { type: ["string", "null"] },
        countryOrigin: { type: ["string", "null"] },
        countryInterest: { type: ["string", "null"] },
        scholarshipTypes: {
          type: "array",
          items: { type: "string", enum: Object.values(CoverageType) },
        },
        language: { type: ["string", "null"] },
        situation: { type: ["string", "null"] },
        goals: { type: ["string", "null"] },
      },
      required: [
        "academicLevel",
        "fieldOfInterest",
        "countryOrigin",
        "countryInterest",
        "scholarshipTypes",
        "language",
        "situation",
        "goals",
      ],
      additionalProperties: false,
    },
  },
  required: ["reply", "profileReady", "profile"],
  additionalProperties: false,
};

/** El servicio de IA (Groq) no está disponible, no respondió a tiempo, o está mal configurado. */
export class AiUnavailableError extends Error {}

/** Groq respondió, pero el contenido no es JSON válido o no cumple el esquema esperado. */
export class AiParseError extends Error {
  constructor(
    message: string,
    public readonly raw: unknown,
  ) {
    super(message);
  }
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

type ResponseFormat =
  | {
      type: "json_schema";
      json_schema: { name: string; schema: object; strict: true };
    }
  | { type: "json_object" };

const JSON_SCHEMA_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "profile_assistant_turn",
    schema: RESPONSE_SCHEMA,
    strict: true,
  },
};

const JSON_OBJECT_FORMAT: ResponseFormat = { type: "json_object" };

async function callGroq(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
  responseFormat: ResponseFormat,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      response_format: responseFormat,
    }),
    signal,
  });
}

/**
 * Da el siguiente turno de la conversación del asistente de perfil: recibe
 * el historial completo (`messages`, terminando en el último mensaje del
 * usuario) y devuelve la respuesta del asistente, más el perfil estructurado
 * cuando ya hay suficiente información (`profileReady: true`).
 *
 * Lanza `AiUnavailableError` si Groq no responde, responde con error, o
 * falta `GROQ_API_KEY`; y `AiParseError`/`ZodError` si la respuesta no es
 * JSON válido o no cumple el esquema esperado. El llamador debe degradar con
 * gracia (permitir que el estudiante llene el perfil a mano).
 */
export async function chatWithAssistant(
  messages: ChatMessage[],
): Promise<AssistantTurn> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[profile-assistant] GROQ_API_KEY no está configurada");
    throw new AiUnavailableError("GROQ_API_KEY no está configurada");
  }

  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  let response: Response;
  try {
    response = await callGroq(
      messages,
      apiKey,
      model,
      JSON_SCHEMA_FORMAT,
      controller.signal,
    );

    // Algunos modelos de Groq no soportan `json_schema` estricto; si el
    // único problema es el response_format, reintenta en modo `json_object`.
    if (response.status === 400) {
      const body = await response
        .clone()
        .json()
        .catch(() => null);
      if (body?.error?.param === "response_format") {
        response = await callGroq(
          messages,
          apiKey,
          model,
          JSON_OBJECT_FORMAT,
          controller.signal,
        );
      }
    }
  } catch (error) {
    throw new AiUnavailableError(
      error instanceof Error
        ? `No se pudo conectar con Groq: ${error.message}`
        : "No se pudo conectar con Groq",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error(
        "[profile-assistant] Groq respondió 401: GROQ_API_KEY inválida o faltante",
      );
    } else {
      console.error(
        `[profile-assistant] Groq respondió con estado ${response.status}`,
      );
    }
    throw new AiUnavailableError(
      `Groq respondió con estado ${response.status}`,
    );
  }

  const data = (await response.json()) as GroqChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiParseError("Respuesta de Groq sin contenido de texto", data);
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new AiParseError("La respuesta de Groq no es JSON válido", content);
  }

  try {
    return assistantTurnSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AiParseError(
        "La respuesta de Groq no cumple el esquema esperado",
        json,
      );
    }
    throw error;
  }
}
