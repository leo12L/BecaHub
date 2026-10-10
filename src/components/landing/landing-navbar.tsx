import Link from "next/link";
import { LandingWordmark } from "@/components/landing/landing-wordmark";

export const LANDING_NAV_LINKS = [
  { href: "#descubre", label: "Descubre" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#nosotros", label: "Nosotros" },
] as const;

export function LandingNavbar() {
  return (
    <header className="lf-nav">
      <Link href="/" className="lf-nav-logo" aria-label="BecaHub, ir al inicio">
        <LandingWordmark size="sm" tone="ink" />
        <span aria-hidden="true">↗</span>
      </Link>

      <nav className="lf-nav-pill" aria-label="Navegación principal">
        <ul className="lf-nav-links">
          {LANDING_NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="lf-nav-end">
        <details className="lf-nav-mobile relative">
          <summary className="lf-pill lf-pill-nav cursor-pointer list-none">
            Menú
          </summary>
          <ul className="absolute top-full right-0 z-30 mt-2 w-48 rounded-none border border-[var(--lf-line)] bg-white p-2 shadow-lg">
            {LANDING_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium text-[var(--lf-ink)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
        <Link href="/becas" className="lf-pill lf-pill-green">
          Explorar becas ↗
        </Link>
      </div>
    </header>
  );
}
