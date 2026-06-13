import { checkUrlHealth } from "@/lib/validation/url-health";
import { MEXICO_PATTERN } from "@/lib/geo";

export interface PublishCheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Invariante de publicación del panel de admin: una beca solo puede pasar a
 * `ACTIVE` si es de México, su `deadline` es hoy o futuro, y `applyUrl`
 * responde como una convocatoria viva (`checkUrlHealth`). Llamado desde los
 * route handlers de creación/edición/re-verificación — nunca confía en lo
 * que mande el cliente.
 */
export async function assertCanPublish(input: {
  countryDestination: string;
  deadline: Date | null;
  applyUrl: string;
}): Promise<PublishCheckResult> {
  if (!MEXICO_PATTERN.test(input.countryDestination)) {
    return {
      ok: false,
      error: "Solo se pueden publicar becas para México",
    };
  }

  if (!input.deadline) {
    return {
      ok: false,
      error: "La fecha límite es obligatoria para publicar como activa",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (input.deadline.getTime() < today.getTime()) {
    return {
      ok: false,
      error: "La fecha límite ya pasó; no se puede publicar como activa",
    };
  }

  const health = await checkUrlHealth(input.applyUrl);
  if (!health.valid) {
    return {
      ok: false,
      error: `El link de la convocatoria no es válido: ${health.reason ?? "desconocido"}`,
    };
  }

  return { ok: true };
}
