"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HERO_MOSAIC } from "@/components/landing/landing-photos";

export function HeroCollage({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) setPaused(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const tiles = [...HERO_MOSAIC, ...HERO_MOSAIC];

  return (
    <div className="lf-hero-stage">
      <div className="lf-masonry" aria-hidden="true">
        <div
          className="lf-masonry-track"
          data-landing-collage-col="up"
          data-paused={paused || reduceMotion ? "true" : "false"}
        >
          {tiles.map((photo, i) => (
            <figure
              key={`${photo.src}-${photo.tag}-${i}`}
              className="lf-photo lf-masonry-tile"
              data-h={photo.h}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt=""
                width={800}
                height={600}
                loading="eager"
                decoding="async"
                data-testid={i < 6 ? `landing-hero-img-${i}` : undefined}
              />
              <figcaption className="lf-tag bottom-2 left-2">
                {photo.tag}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="lf-hero-wash" />

      <div className="lf-hero-copy-wrap">{children}</div>

      <button
        type="button"
        className="lf-pill lf-pill-ghost lf-pause"
        data-testid="landing-pause-collage"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? "Reanudar carrusel" : "Pausar carrusel"}
      </button>
    </div>
  );
}
