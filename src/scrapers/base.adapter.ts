import PQueue from "p-queue";
import type { RawScholarship, ScraperAdapter } from "./types";

export const SCRAPER_USER_AGENT =
  "BecaHubBot/1.0 (+https://becahub.example/about-bot)";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

interface RobotsRules {
  disallow: string[];
}

/**
 * Clase base para todos los adaptadores de scraping. Encapsula los
 * principios de scraping responsable (robots.txt, throttle de 1 req/seg
 * por dominio, User-Agent identificable, retry con backoff) para que cada
 * adapter concreto solo se preocupe por extraer y mapear datos.
 */
export abstract class BaseAdapter implements ScraperAdapter {
  abstract readonly name: string;
  abstract readonly sourceSlug: string;
  abstract scrape(): Promise<RawScholarship[]>;

  /** Una cola por dominio, compartida durante toda la corrida del proceso. */
  private static readonly domainQueues = new Map<string, PQueue>();
  /** robots.txt cacheado por dominio durante la corrida. */
  private static readonly robotsCache = new Map<string, RobotsRules | null>();

  protected log(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      adapter: this.name,
      level,
      message,
      ...meta,
    };
    const serialized = JSON.stringify(entry);
    if (level === "error") console.error(serialized);
    else if (level === "warn") console.warn(serialized);
    else console.log(serialized);
  }

  private getDomainQueue(domain: string): PQueue {
    let queue = BaseAdapter.domainQueues.get(domain);
    if (!queue) {
      queue = new PQueue({ intervalCap: 1, interval: 1000 });
      BaseAdapter.domainQueues.set(domain, queue);
    }
    return queue;
  }

  private async getRobotsRules(domain: string): Promise<RobotsRules | null> {
    if (BaseAdapter.robotsCache.has(domain)) {
      return BaseAdapter.robotsCache.get(domain) ?? null;
    }

    let rules: RobotsRules | null = null;
    try {
      const response = await fetch(`https://${domain}/robots.txt`, {
        headers: { "User-Agent": SCRAPER_USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.ok) {
        const body = await response.text();
        rules = parseRobotsTxt(body);
      }
    } catch (error) {
      this.log("warn", "No se pudo obtener robots.txt, se asume permitido", {
        domain,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    BaseAdapter.robotsCache.set(domain, rules);
    return rules;
  }

  /** Verifica si `url` está permitida por el robots.txt de su dominio. */
  protected async isAllowedByRobots(url: string): Promise<boolean> {
    const parsed = new URL(url);
    const rules = await this.getRobotsRules(parsed.hostname);
    if (!rules) return true;

    return !rules.disallow.some((path) => parsed.pathname.startsWith(path));
  }

  /**
   * Descarga una URL respetando robots.txt, el throttle de 1 req/seg por
   * dominio y con retry con backoff exponencial ante errores transitorios.
   * Lanza si la URL está prohibida por robots.txt o si los reintentos se
   * agotan.
   */
  protected async fetchPage(url: string): Promise<string> {
    const allowed = await this.isAllowedByRobots(url);
    if (!allowed) {
      throw new Error(`Bloqueado por robots.txt: ${url}`);
    }

    const domain = new URL(url).hostname;
    const queue = this.getDomainQueue(domain);

    return queue.add(() => this.fetchWithRetry(url)) as Promise<string>;
  }

  private async fetchWithRetry(url: string, attempt = 1): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": SCRAPER_USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al solicitar ${url}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      this.log("warn", "Fallo al descargar, reintentando", {
        url,
        attempt,
        delayMs: delay,
        error: error instanceof Error ? error.message : String(error),
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, attempt + 1);
    }
  }
}

/**
 * Parser minimalista de robots.txt: solo extrae las reglas `Disallow`
 * aplicables a `User-agent: *` o a `BecaHubBot`, que es lo necesario para
 * decidir si una ruta puede scrapearse.
 */
function parseRobotsTxt(body: string): RobotsRules {
  const disallow: string[] = [];
  let applies = false;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;

    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase() === "becahubbot";
    } else if (key === "disallow" && applies && value) {
      disallow.push(value);
    }
  }

  return { disallow };
}
