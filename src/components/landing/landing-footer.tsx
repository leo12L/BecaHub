import Link from "next/link";
import { LandingWordmark } from "@/components/landing/landing-wordmark";

const exploreLinks = [
  { href: "#descubre", label: "Oportunidades" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#preparate", label: "El proceso" },
];

const becasLinks = [
  { href: "/becas", label: "Todas las becas" },
  { href: "/becas", label: "Por categoría" },
];

const pendingSocials = ["Instagram", "LinkedIn", "Facebook"] as const;

export function LandingFooter() {
  return (
    <footer
      id="comunidad"
      className="lf-footer scroll-mt-8"
      data-testid="landing-footer"
    >
      <div className="lf-footer-grid">
        <div>
          <LandingWordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--lf-muted)]">
            Más oportunidades, nuevos caminos.
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
          <h2 className="text-sm font-semibold">Becas</h2>
          <ul className="mt-4 space-y-2">
            {becasLinks.map((link) => (
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
          <ul className="mt-4 space-y-2">
            {pendingSocials.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  disabled
                  data-social-pending={label}
                  title={`Pendiente: ${label} (sin URL todavía)`}
                  aria-label={`Pendiente: ${label} (sin URL todavía)`}
                  className="text-sm text-[var(--lf-muted)] opacity-70"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
