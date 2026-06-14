import Link from "next/link";
import { ArrowRight, BookOpen, Globe2, ShieldCheck } from "lucide-react";
import { ScholarshipVerticalCarousel } from "./scholarship-vertical-carousel";
import type { BecaListItem, getLandingStats } from "@/lib/becas/queries";

export function HeroSection({
  scholarships,
  stats,
}: {
  scholarships: BecaListItem[];
  stats: Awaited<ReturnType<typeof getLandingStats>>;
}) {
  return (
    <section className="bg-background relative overflow-hidden px-6 py-20 lg:py-28">
      <div className="relative mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_420px]">
        {/* ── Columna izquierda ── */}
        <div>
          {/* Eyebrow */}
          <div className="border-primary/20 bg-secondary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <span className="bg-primary size-1.5 rounded-full" />
            <p className="text-primary text-xs font-bold tracking-widest uppercase">
              Portal de oportunidades académicas
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-foreground mb-5 text-4xl leading-tight font-extrabold tracking-tight lg:text-5xl xl:text-6xl">
            Encuentra becas <span className="text-primary">que sí van</span>{" "}
            contigo
          </h1>

          {/* Subtítulo */}
          <p className="text-muted-foreground mb-8 max-w-lg text-base leading-relaxed">
            Centraliza convocatorias, requisitos y fechas importantes en una
            sola plataforma diseñada para ayudarte a avanzar.
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/becas"
              className="bg-primary hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
            >
              Explorar becas
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="border-border text-foreground hover:border-primary/40 hover:text-primary inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-7 py-3 text-sm font-bold shadow-sm transition-all hover:shadow-md"
            >
              Ver panel
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                icon: BookOpen,
                value: stats.totalCount,
                label: "convocatorias",
                color: "text-primary",
              },
              {
                icon: Globe2,
                value: stats.countriesCount,
                label: stats.countriesCount === 1 ? "país" : "países",
                color: "text-highlight",
              },
              {
                icon: ShieldCheck,
                value: `${stats.verifiedPercentage}%`,
                label: "verificadas",
                color: "text-primary",
              },
            ].map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="border-border bg-secondary/70 rounded-2xl border px-4 py-3 text-center"
              >
                <div
                  className={`flex items-center justify-center gap-1 ${color}`}
                >
                  <Icon size={14} />
                  <p className="text-xl font-extrabold">{value}</p>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Columna derecha: Carrusel ── */}
        <div className="w-full">
          <ScholarshipVerticalCarousel scholarships={scholarships} />
        </div>
      </div>
    </section>
  );
}
