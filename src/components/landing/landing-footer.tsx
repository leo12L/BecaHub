import Link from "next/link";
import { LandingWordmark } from "@/components/landing/landing-wordmark";

const exploreLinks = [
  { href: "#descubre", label: "Oportunidades" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#preparate", label: "El proceso" },
];

const pendingSocials = ["Instagram", "LinkedIn"] as const;

export function LandingFooter() {
  return (
    <footer
      id="nosotros"
      className="lf-footer scroll-mt-8"
      data-testid="landing-footer"
    >
      <div className="lf-footer-grid">
        <div>
          <LandingWordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--lf-muted)]">
            Más oportunidades. Nuevos caminos.
          </p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--lf-muted)]">
            Prototipo visual. Las imágenes y categorías son ilustrativas.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Explora</h2>
          <ul className="mt-4 space-y-2">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--lf-muted)] hover:text-[var(--lf-green)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Redes sociales</h2>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {pendingSocials.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  disabled
                  data-social-pending={label}
                  title={`Pendiente: ${label} (sin URL todavía)`}
                  aria-label={`Pendiente: ${label} (sin URL todavía)`}
                  className="text-sm text-[var(--lf-green)] opacity-80"
                >
                  {label} ↗
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
