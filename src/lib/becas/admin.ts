import { checkUrlHealth } from "@/lib/validation/url-health";
import { getTodayInMexicoCity } from "@/lib/fechas";

export interface PublishCheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Invariante de publicación del panel de admin: una beca solo puede pasar a
 * `ACTIVE` si su `deadline` es hoy o futuro, y `applyUrl` responde como una
 * convocatoria viva (`checkUrlHealth`). Llamado desde los route handlers de
 * creación/edición/re-verificación — nunca confía en lo que mande el cliente.
 */
export async function assertCanPublish(input: {
  destinationCountries: string[];
  deadline: Date | null;
  applyUrl: string;
}): Promise<PublishCheckResult> {
  if (!input.deadline) {
    return {
      ok: false,
      error: "La fecha límite es obligatoria para publicar como activa",
    };
  }

  const todayMexico = getTodayInMexicoCity();
  if (input.deadline.getTime() < todayMexico.getTime()) {
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
