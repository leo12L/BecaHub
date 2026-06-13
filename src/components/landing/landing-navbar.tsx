/**
 * Landing Navbar Component
 * Sticky navigation bar for the public landing page.
 */

"use client";

import { BecaHubLogo } from "@/components/brand/becahub-logo";

export function LandingNavbar() {
  return (
    <nav
      className="sticky top-0 z-50 h-14 bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo - left side */}
      <div className="flex-shrink-0">
        <div className="hidden lg:block w-40">
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
          className="px-4 py-2 text-sm font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-md hover:bg-[#F5F5F5] transition-colors duration-150"
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
          className="px-4 py-2 text-sm font-medium text-white bg-[#800020] rounded-md hover:bg-[#6a001a] transition-colors duration-150"
          aria-label="Sign up"
        >
          Registrarse
        </button>
      </div>
    </nav>
  );
}
