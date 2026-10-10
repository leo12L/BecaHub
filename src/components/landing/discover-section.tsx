import Link from "next/link";
import { PhotoCarousel } from "@/components/landing/photo-carousel";
import { DISCOVER_SLIDES } from "@/components/landing/landing-photos";

export function DiscoverSection() {
  return (
    <section
      id="descubre"
      className="lf-section scroll-mt-8"
      data-testid="landing-discover"
    >
      <div className="lf-section-inner">
        <PhotoCarousel
          slides={DISCOVER_SLIDES}
          testId="landing-carousel-discover"
        />
        <div>
          <p className="lf-eyebrow">01 / DESCUBRE</p>
          <h2 className="lf-display mt-4 text-4xl sm:text-5xl">
            Oportunidades que mereces conocer.
          </h2>
          <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-[var(--lf-muted)]">
            Movilidad, apoyo económico, deportes y cursos. Explora los caminos
            que pueden acercarte a lo que quieres estudiar y vivir.
          </p>
          <Link href="#preparate" className="lf-link mt-8">
            Tu siguiente paso →
          </Link>
        </div>
      </div>
      <div className="lf-section-progress" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
