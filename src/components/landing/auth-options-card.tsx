import Link from "next/link";
import { ArrowRight, Search, LogIn, UserPlus } from "lucide-react";

export function AuthOptionsCard() {
  return (
    <div className="border-border w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Card header */}
      <div className="border-border bg-secondary border-b px-8 py-6 text-center">
        <h2 className="text-foreground text-lg font-bold">
          Tu cuenta BecaHub
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Crea una cuenta o inicia sesión para guardar tu perfil y recibir
          recomendaciones personalizadas.
        </p>
      </div>

      {/* Auth actions */}
      <div className="flex flex-col gap-3 px-8 pt-6">
        <Link
          href="/login"
          className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
        >
          <LogIn size={15} />
          Iniciar sesión
        </Link>
        <Link
          href="/login"
          className="border-border text-foreground hover:border-primary/40 hover:text-primary flex items-center justify-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-semibold transition-colors"
        >
          <UserPlus size={15} />
          Crear cuenta gratis
        </Link>
      </div>

      {/* Browse without account */}
      <div className="flex flex-col gap-3 px-8 py-4 sm:flex-row">
        <Link
          href="/becas"
          className="border-border text-muted-foreground hover:text-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <Search size={14} />
          Explorar sin cuenta
        </Link>
        <Link
          href="/dashboard"
          className="border-border text-muted-foreground hover:text-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          Ver panel
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
