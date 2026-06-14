/**
 * Hero Section Component
 * Main landing page hero with headline, CTA buttons, and scholarship carousel.
 */

import Link from "next/link";
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
    <section className="px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_420px]">
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <p className="mb-4 text-xs font-semibold tracking-widest text-[#800020] uppercase">
            Portal de oportunidades académicas
          </p>

          {/* Headline */}
          <h1 className="mb-4 text-4xl leading-tight font-semibold text-[#1A1A1A] lg:text-5xl">
            Encuentra becas que sí van contigo
          </h1>

          {/* Subtitle */}
          <p className="mb-8 max-w-md text-base leading-relaxed text-[#6B7280]">
            Centraliza convocatorias, requisitos y fechas importantes en una
            sola plataforma diseñada para ayudarte a avanzar.
          </p>

          {/* CTA Buttons */}
          <div className="mb-10 flex flex-col gap-3 sm:flex-row">
            {/* Primary button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-[#800020] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#6a001a]"
            >
              {/* TODO(auth): Proteger esta ruta cuando exista autenticación */}
              Entrar
            </Link>

            {/* Secondary button */}
            <Link
              href="/becas"
              className="inline-flex items-center justify-center rounded-md border border-[#E8E8E8] px-6 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors duration-150 hover:bg-[#F5F5F5]"
            >
              Ver oportunidades
            </Link>
          </div>

          {/* Stats chips */}
          <div className="mt-10 flex flex-wrap gap-6">
            <div>
              <p className="text-lg font-bold text-[#800020]">
                {stats.activeCount}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">becas activas</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#004451]">
                {stats.countriesCount}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {stats.countriesCount === 1 ? "país" : "países"}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#800020]">
                {stats.verifiedPercentage}%
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">becas verificadas</p>
            </div>
          </div>
        </div>

        {/* Right column - Carousel */}
        <div>
          <ScholarshipVerticalCarousel scholarships={scholarships} />
        </div>
      </div>
    </section>
  );
}
