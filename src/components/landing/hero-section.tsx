import Link from "next/link";
import { HERO_TILES } from "@/components/landing/landing-photos";

export function HeroSection() {
  return (
    <section className="lf-hero" data-testid="landing-hero">
      <div className="lf-hero-grid">
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
              Encuentra tu beca →
            </Link>
            <Link href="#como-funciona" className="lf-pill lf-pill-ghost">
              Conoce cómo funciona
            </Link>
          </div>
        </div>

        {HERO_TILES.map((tile) => (
          <figure
            key={tile.slot}
            className="lf-hero-tile lf-photo"
            data-slot={tile.slot}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.src}
              alt={tile.alt}
              width={1200}
              height={800}
              loading="eager"
              decoding="async"
              fetchPriority={
                tile.slot === "a" || tile.slot === "d" ? "high" : "auto"
              }
              data-testid={`landing-hero-img-${tile.slot}`}
            />
            <figcaption className="lf-tag bottom-3 left-3">
              {tile.tag}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
