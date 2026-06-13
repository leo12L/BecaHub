import { ZodError } from "zod";
import { CoverageType, AcademicLevel } from "@/generated/prisma/enums";
import {
  parsedScholarshipSchema,
  type ParsedScholarship,
} from "@/validators/ai.validator";

const GROQ_TIMEOUT_MS = 30_000;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Eres un asistente que extrae información estructurada de becas a partir de texto libre en español (por ejemplo, una convocatoria copiada de una página web).

Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, sin explicaciones y sin bloques de markdown. El JSON debe tener exactamente estas claves:

- "title": string. Título o nombre de la beca.
- "description": string. Resumen breve de la beca (qué cubre, requisitos clave).
- "deadline": string en formato "YYYY-MM-DD" con la fecha límite, o null si no se menciona.
- "coverageType": uno de ${Object.values(CoverageType).join(", ")}, o null si no se puede determinar.
- "country": string con el país o países destino, o null si no se menciona.
- "level": uno de ${Object.values(AcademicLevel).join(", ")}, o null si no se puede determinar.

No incluyas ninguna URL ni campo "applyUrl": la URL de aplicación la determina el
pipeline a partir de la página que se descargó, nunca el modelo. Si un dato no
aparece en el texto, usa null para ese campo. No inventes información.`;

/** JSON Schema para `response_format: { type: "json_schema" }` de Groq (modo strict). */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    deadline: { type: ["string", "null"] },
    coverageType: {
      type: ["string", "null"],
      enum: [...Object.values(CoverageType), null],
    },
    country: { type: ["string", "null"] },
    level: {
      type: ["string", "null"],
      enum: [...Object.values(AcademicLevel), null],
    },
  },
  required: [
    "title",
    "description",
    "deadline",
    "coverageType",
    "country",
    "level",
  ],
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
    name: "scholarship_extraction",
    schema: RESPONSE_SCHEMA,
    strict: true,
  },
};

const JSON_OBJECT_FORMAT: ResponseFormat = { type: "json_object" };

async function callGroq(
  text: string,
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
        { role: "user", content: text },
      ],
      response_format: responseFormat,
    }),
    signal,
  });
}

/**
 * Extrae campos estructurados de una beca a partir de texto libre usando la
 * API de Groq (hosted, OpenAI-compatible). No escribe en la base de datos: el
 * resultado es para pre-rellenar el formulario de revisión humana.
 *
 * Lanza `AiUnavailableError` si Groq no responde, responde con error, o falta
 * `GROQ_API_KEY`; y `AiParseError`/`ZodError` si la respuesta no es JSON
 * válido o no cumple el esquema esperado.
 */
export async function parseScholarshipText(
  text: string,
): Promise<ParsedScholarship> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[parse-scholarship] GROQ_API_KEY no está configurada");
    throw new AiUnavailableError("GROQ_API_KEY no está configurada");
  }

  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  let response: Response;
  try {
    response = await callGroq(
      text,
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
          text,
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
        "[parse-scholarship] Groq respondió 401: GROQ_API_KEY inválida o faltante",
      );
    } else {
      console.error(
        `[parse-scholarship] Groq respondió con estado ${response.status}`,
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
    return parsedScholarshipSchema.parse(json);
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
