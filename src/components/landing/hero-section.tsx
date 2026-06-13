/**
 * Hero Section Component
 * Main landing page hero with headline, CTA buttons, and scholarship carousel.
 */

import Link from "next/link";
import { ScholarshipVerticalCarousel } from "./scholarship-vertical-carousel";

export function HeroSection() {
  return (
    <section className="py-20 lg:py-28 px-6">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center">
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <p className="text-xs uppercase tracking-widest text-[#800020] mb-4 font-semibold">
            Portal de oportunidades académicas
          </p>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-[#1A1A1A] mb-4">
            Encuentra becas que sí van contigo
          </h1>

          {/* Subtitle */}
          <p className="text-base text-[#6B7280] leading-relaxed max-w-md mb-8">
            Centraliza convocatorias, requisitos y fechas importantes en una sola plataforma diseñada
            para ayudarte a avanzar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            {/* Primary button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-[#800020] text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-[#6a001a] transition-colors duration-150"
            >
              {/* TODO(auth): Proteger esta ruta cuando exista autenticación */}
              Entrar
            </Link>

            {/* Secondary button */}
            <a
              href="#scholarships"
              className="inline-flex items-center justify-center border border-[#E8E8E8] text-[#1A1A1A] rounded-md px-6 py-2.5 text-sm font-medium hover:bg-[#F5F5F5] transition-colors duration-150"
            >
              Ver oportunidades
            </a>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-6 mt-10">
            <div>
              <p className="text-lg font-bold text-[#800020]">1,204</p>
              <p className="text-xs text-[#6B7280] mt-1">becas activas</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#004451]">68</p>
              <p className="text-xs text-[#6B7280] mt-1">países</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#800020]">94%</p>
              <p className="text-xs text-[#6B7280] mt-1">match promedio</p>
            </div>
          </div>
        </div>

        {/* Right column - Carousel */}
        <div>
          <ScholarshipVerticalCarousel />
        </div>
      </div>
    </section>
  );
}
