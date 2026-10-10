import { getBecas } from "@/lib/becas/queries";
import { becasQuerySchema } from "@/validators/becas.validator";
import {
  MIN_LANDING_STRIP_CARDS,
  buildLandingStripCards,
  type LandingStripCard,
} from "@/lib/becas/landing-cards";

/**
 * Helper de consulta pública (ya no alimenta la portada visual).
 * Delegamos el WHERE a `getBecas()`, que aplica `filtroBecaPublica()`
 * (ACTIVE y no vencida). Esta función no arma su propio filtro de estado.
 */
export async function getLandingStripBecas(): Promise<LandingStripCard[]> {
  const query = becasQuerySchema.parse({
    page: 1,
    limit: MIN_LANDING_STRIP_CARDS,
  });
  const { data } = await getBecas(query, { sort: "deadline" });
  return buildLandingStripCards(data);
}
