import Link from "next/link";
import { PhotoCarousel } from "@/components/landing/photo-carousel";
import { PREPARE_SLIDES } from "@/components/landing/landing-photos";

export function PrepareSection() {
  return (
    <section
      id="preparate"
      className="lf-section scroll-mt-8 pt-2"
      data-testid="landing-preparate"
    >
      <div className="lf-section-inner">
        <div>
          <p className="lf-eyebrow">02 / Prepárate</p>
          <h2 className="lf-display mt-4 text-4xl sm:text-5xl">
            El siguiente paso empieza contigo.
          </h2>
          <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-[var(--lf-muted)]">
            Conoce cada convocatoria, revisa los requisitos y organiza tus
            documentos. Una oportunidad se vuelve posible cuando sabes por dónde
            empezar.
          </p>
          <Link href="#como-funciona" className="lf-link mt-8">
            Conoce el proceso →
          </Link>
        </div>
        <PhotoCarousel
          slides={PREPARE_SLIDES}
          testId="landing-carousel-prepare"
        />
      </div>
    </section>
  );
}
