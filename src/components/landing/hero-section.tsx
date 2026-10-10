import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScholarshipStrips } from "@/components/landing/scholarship-strips";
import type { LandingStripCard } from "@/lib/becas/landing-cards";
import type { getLandingStats } from "@/lib/becas/queries";

export function HeroSection({
  cards,
  stats,
}: {
  cards: LandingStripCard[];
  stats: Awaited<ReturnType<typeof getLandingStats>>;
}) {
  return (
    <section className="bg-background relative isolate min-h-[100svh] overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:pt-32">
      <div className="bg-background relative z-10 mx-auto mt-8 flex w-[min(100%,19.75rem)] flex-col items-center px-3 py-6 text-center md:mt-0 md:w-full md:max-w-2xl md:px-4 md:py-8">
        <p className="text-primary mb-4 text-sm font-bold tracking-[0.28em] uppercase">
          BecaHub
        </p>
        <h1 className="text-foreground text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Encuentra las becas de las que no te has enterado
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
          Convocatorias reales, vigentes y para estudiantes en México.
          Centralizamos fechas, requisitos y el enlace oficial en un solo lugar.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/becas"
            className="bg-primary hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-none px-7 py-3 text-sm font-bold text-white shadow-sm"
          >
            Explorar becas
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="border-border bg-card text-foreground hover:border-primary/40 inline-flex items-center justify-center rounded-none border px-7 py-3 text-sm font-bold shadow-sm"
          >
            Crear cuenta
          </Link>
        </div>

        <dl className="mt-12 grid w-full max-w-lg grid-cols-3 gap-3">
          {[
            {
              value: stats.totalCount,
              label: stats.totalCount === 1 ? "convocatoria" : "convocatorias",
              testId: "stat-convocatorias",
            },
            {
              value: stats.countriesCount,
              label: stats.countriesCount === 1 ? "país" : "países",
              testId: "stat-paises",
            },
            {
              value: `${stats.verifiedPercentage}%`,
              label: "verificadas",
              testId: "stat-verificadas",
            },
          ].map(({ value, label, testId }) => (
            <div
              key={testId}
              className="border-border bg-card/90 rounded-none border px-3 py-3 text-center shadow-sm"
            >
              <dt className="text-muted-foreground text-[11px]">{label}</dt>
              <dd
                className="text-foreground mt-1 text-xl font-extrabold"
                data-testid={testId}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className="landing-hero-veil pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
      />
      <ScholarshipStrips cards={cards} />
    </section>
  );
}
