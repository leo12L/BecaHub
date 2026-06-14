"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Bot, LogOut, LogIn } from "lucide-react";

export function DashboardTopbar() {
  const { data: session } = useSession();
  const userName =
    session?.user?.name ??
    session?.user?.email?.split("@")[0] ??
    "estudiante";

  return (
    <header className="border-border bg-card flex shrink-0 flex-col gap-4 border-b px-4 py-4 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      {/* Search */}
      <form action="/becas" className="w-full max-w-2xl">
        <div className="border-border bg-secondary/60 focus-within:border-primary focus-within:ring-primary flex items-center gap-3 rounded-xl border px-3 py-2.5 focus-within:ring-1">
          <Search size={16} className="text-highlight shrink-0" />
          <input
            name="search"
            type="text"
            placeholder="Buscar becas, instituciones, países…"
            className="text-foreground flex-1 bg-transparent text-sm placeholder:text-[#6F8A82] focus:outline-none"
            aria-label="Buscar becas"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div className="text-left lg:text-right">
          <p className="text-foreground text-sm font-bold">Hola, {userName}</p>
          <p className="text-muted-foreground text-xs">
            {session ? "Sesión activa" : "Convocatorias verificadas"}
          </p>
        </div>

        {/* AI Assistant button */}
        <Link
          href="/perfil/asistente"
          className="border-primary/20 bg-secondary text-primary hover:border-primary/40 hover:bg-primary/10 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
          aria-label="Abrir asistente IA"
          title="Asistente IA"
        >
          <Bot size={16} />
          <span className="hidden sm:inline">Asistente IA</span>
        </Link>

        {/* Auth button */}
        {session ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="border-border text-muted-foreground hover:text-primary flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition-all"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="border-border text-muted-foreground hover:text-primary flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition-all"
            title="Iniciar sesión"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}
      </div>
    </header>
  );
}
