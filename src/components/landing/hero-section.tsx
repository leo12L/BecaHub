import Link from "next/link";
import { HeroCollage } from "@/components/landing/hero-collage";

export function HeroSection() {
  return (
    <section className="lf-hero" data-testid="landing-hero">
      <HeroCollage>
        <div className="lf-hero-copy">
          <p className="lf-eyebrow">El mundo está lleno de oportunidades</p>
          <h1 className="lf-display lf-hero-title mt-5">
            Encuentra las becas de las que <em>no</em> te has enterado.
          </h1>
          <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-[var(--lf-muted)]">
            Tu próxima oportunidad puede estar más cerca de lo que crees.
            Empieza por descubrirla.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/becas" className="lf-pill lf-pill-green">
              Encuentra tu beca ↗
            </Link>
            <Link href="#como-funciona" className="lf-pill lf-pill-ghost">
              Conoce cómo funciona
            </Link>
          </div>
        </div>
      </HeroCollage>
    </section>
  );
}
