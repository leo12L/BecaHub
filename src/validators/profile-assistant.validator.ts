import { z } from "zod";
import { AcademicLevel, CoverageType } from "@/generated/prisma/enums";

const academicLevelValues = Object.values(AcademicLevel) as [
  string,
  ...string[],
];
const coverageTypeValues = Object.values(CoverageType) as [string, ...string[]];

/** Un turno de la conversación con el asistente de perfil. */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Body de `POST /api/perfil/asistente`. */
export const profileAssistantRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
});

export type ProfileAssistantRequest = z.infer<
  typeof profileAssistantRequestSchema
>;

/**
 * Perfil estructurado que propone el asistente (o que llena el estudiante a
 * mano). Todos los campos salvo `scholarshipTypes` son `nullable` porque la
 * conversación puede no haber cubierto ese dato todavía.
 */
export const profileDraftSchema = z.object({
  academicLevel: z.enum(academicLevelValues).nullable(),
  fieldOfInterest: z.string().nullable(),
  countryOrigin: z.string().nullable(),
  countryInterest: z.string().nullable(),
  scholarshipTypes: z.array(z.enum(coverageTypeValues)),
  language: z.string().nullable(),
  situation: z.string().nullable(),
  goals: z.string().nullable(),
});

export type ProfileDraft = z.infer<typeof profileDraftSchema>;

/** Respuesta del asistente: el siguiente mensaje y, si ya hay info suficiente, el perfil propuesto. */
export const assistantTurnSchema = z.object({
  reply: z.string(),
  profileReady: z.boolean(),
  profile: profileDraftSchema.nullable(),
});

export type AssistantTurn = z.infer<typeof assistantTurnSchema>;

/** Body de `POST /api/perfil` (guardar perfil). */
export const saveProfileSchema = profileDraftSchema;
