import Link from "next/link";
import { HeroCollage } from "@/components/landing/hero-collage";

export function HeroSection() {
  return (
    <section className="lf-hero" data-testid="landing-hero">
      <HeroCollage>
        <div className="lf-hero-copy">
          <p className="lf-eyebrow">El mundo está lleno de oportunidades</p>
          <h1 className="lf-hero-title">
            Encuentra las becas
            <br />
            de las que <em>no te has</em>
            <br />
            <em>enterado.</em>
          </h1>
          <p className="lf-hero-lead">
            Tu próxima oportunidad puede estar más cerca de lo que crees.
            Empieza por descubrirla.
          </p>
          <div className="lf-hero-actions">
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
