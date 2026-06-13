import { SCRAPER_USER_AGENT } from "./base.adapter";

const LIVENESS_TIMEOUT_MS = 10_000;

/**
 * Verifica que `url` responda con un estado HTTP exitoso (2xx/3xx tras
 * seguir redirecciones). Intenta primero `HEAD` (más liviano); si el
 * servidor no lo soporta (405/403/404), reintenta con `GET`. No lanza:
 * cualquier error de red o timeout se considera "no vivo".
 */
export async function validateUrlIsLive(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": SCRAPER_USER_AGENT },
      signal: AbortSignal.timeout(LIVENESS_TIMEOUT_MS),
    });

    if (head.ok) return true;
    if (![403, 404, 405].includes(head.status)) return false;
  } catch {
    // Algunos servidores rechazan HEAD por completo (timeout, conexión
    // cerrada); se reintenta con GET antes de descartar la URL.
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": SCRAPER_USER_AGENT },
      signal: AbortSignal.timeout(LIVENESS_TIMEOUT_MS),
    });
    return get.ok;
  } catch {
    return false;
  }
}
