/**
 * Landing Navbar Component
 * Sticky navigation bar for the public landing page.
 */

import Link from "next/link";
import { BecaHubLogo } from "@/components/brand/becahub-logo";

export function LandingNavbar() {
  return (
    <nav
      className="border-border bg-card sticky top-0 z-50 flex h-14 items-center justify-between border-b px-6"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex-shrink-0">
        <div className="hidden w-40 lg:block">
          <BecaHubLogo variant="horizontal" className="h-8" />
        </div>
        <div className="lg:hidden">
          <BecaHubLogo variant="mark" className="h-7 w-7" />
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex items-center gap-3">
        <Link
          href="/becas"
          className="border-border text-foreground hover:border-primary/40 hover:text-primary hidden rounded-md border px-4 py-2 text-sm font-medium transition-colors duration-150 sm:inline-flex"
        >
          Ver becas
        </Link>
        <Link
          href="/solicitud-beca"
          className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
        >
          Solicitar beca
        </Link>
      </div>
    </nav>
  );
}
