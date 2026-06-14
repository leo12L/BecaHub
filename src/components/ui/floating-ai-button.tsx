"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatingAIButton() {
  const pathname = usePathname();

  // Don't show the FAB on the assistant page itself
  if (pathname.startsWith("/perfil/asistente")) return null;

  return (
    <Link
      href="/perfil/asistente"
      aria-label="Abrir asistente IA"
      title="Asistente BecaHub"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#800020] shadow-lg transition-all hover:bg-[#6a001a] hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020] focus-visible:ring-offset-2"
    >
      <Bot size={22} className="text-white" />
    </Link>
  );
}
