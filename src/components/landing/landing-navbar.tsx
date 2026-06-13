/**
 * Landing Navbar Component
 * Sticky navigation bar for the public landing page.
 */

"use client";

import { BecaHubLogo } from "@/components/brand/becahub-logo";

export function LandingNavbar() {
  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#E8E8E8] bg-white px-6"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo - left side */}
      <div className="flex-shrink-0">
        <div className="hidden w-40 lg:block">
          <BecaHubLogo variant="horizontal" className="h-8" />
        </div>
        <div className="lg:hidden">
          <BecaHubLogo variant="mark" className="h-7 w-7" />
        </div>
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Sign in button */}
        <button
          onClick={() => {
            // TODO(auth): Conectar con proveedor de autenticación
            console.log("Iniciar sesión");
          }}
          className="rounded-md border border-[#E8E8E8] px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors duration-150 hover:bg-[#F5F5F5]"
          aria-label="Sign in"
        >
          Iniciar sesión
        </button>

        {/* Sign up button */}
        <button
          onClick={() => {
            // TODO(auth): Conectar con flujo de registro
            console.log("Registrarse");
          }}
          className="rounded-md bg-[#800020] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#6a001a]"
          aria-label="Sign up"
        >
          Registrarse
        </button>
      </div>
    </nav>
  );
}
