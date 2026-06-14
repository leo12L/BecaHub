"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Home, Search, Bot, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home,     label: "Inicio",         href: "/dashboard"       },
  { icon: Search,   label: "Explorar becas", href: "/becas"           },
  { icon: Bot,      label: "Asistente IA",   href: "/perfil/asistente"},
  { icon: FileText, label: "Solicitar beca", href: "/solicitud-beca"  },
] as const;

function SidebarItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] md:w-full",
        active
          ? "bg-[#800020]/10 text-[#800020]"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {active && (
        <span className="absolute top-2 bottom-2 left-0 hidden w-1 rounded-r-full bg-[#800020] md:block" />
      )}
      <Icon size={18} className="shrink-0" />
      <span className="whitespace-nowrap md:flex-1">{label}</span>
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:border-r md:border-b-0 md:shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 md:flex-col md:items-start">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#800020]">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-800">BecaHub</p>
          <p className="text-xs text-slate-400">Portal de oportunidades</p>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex gap-1 overflow-x-auto px-4 py-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:py-5"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={
              item.href === "/becas"
                ? pathname.startsWith("/becas")
                : item.href === "/perfil/asistente"
                  ? pathname.startsWith("/perfil")
                  : pathname === item.href
            }
          />
        ))}
      </nav>
    </aside>
  );
}
