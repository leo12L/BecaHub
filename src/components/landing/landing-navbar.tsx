import Link from "next/link";
import { BecaHubLogo } from "@/components/brand/becahub-logo";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/becas", label: "Becas" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "/login", label: "Entrar" },
];

export function LandingNavbar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-4">
      <nav
        className="border-border/80 bg-card/80 pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-md md:px-5"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="focus-visible:outline-ring flex shrink-0 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="hidden w-36 sm:block">
            <BecaHubLogo variant="horizontal" className="h-7" />
          </span>
          <span className="sm:hidden">
            <BecaHubLogo variant="mark" className="h-7 w-7" />
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <details className="relative md:hidden">
            <summary className="border-border text-foreground cursor-pointer list-none rounded-full border px-3 py-1.5 text-sm font-medium">
              Menú
            </summary>
            <ul className="border-border bg-card absolute top-full right-0 mt-2 w-44 rounded-2xl border p-2 shadow-lg">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground hover:bg-muted block rounded-xl px-3 py-2 text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <Link
            href="/becas"
            className="bg-primary hover:bg-primary/90 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            Explorar
          </Link>
        </div>
      </nav>
    </div>
  );
}
