"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  HERO_LEFT,
  HERO_PEEK,
  HERO_RIGHT,
  type LandingPhoto,
} from "@/components/landing/landing-photos";

function Tile({
  photo,
  testId,
  tall = false,
}: {
  photo: LandingPhoto & { tag?: string };
  testId?: string;
  tall?: boolean;
}) {
  return (
    <figure
      className={`lf-photo lf-collage-tile ${tall ? "lf-collage-tile-tall" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        width={1200}
        height={800}
        loading="eager"
        decoding="async"
        data-testid={testId}
      />
      {photo.tag ? (
        <figcaption className="lf-tag bottom-3 left-3">{photo.tag}</figcaption>
      ) : null}
    </figure>
  );
}

function Column({
  photos,
  direction,
  paused,
  reduceMotion,
  testPrefix,
}: {
  photos: Array<LandingPhoto & { tag: string }>;
  direction: "up" | "down";
  paused: boolean;
  reduceMotion: boolean;
  testPrefix: string;
}) {
  const loop = [...photos, ...photos];
  return (
    <div className="lf-collage-rail" aria-hidden={false}>
      <div
        className="lf-collage-col"
        data-direction={direction}
        data-paused={paused || reduceMotion ? "true" : "false"}
        data-landing-collage-col={direction}
      >
        {loop.map((photo, i) => (
          <Tile
            key={`${photo.src}-${photo.tag}-${i}`}
            photo={photo}
            tall={i % 3 === 1}
            testId={i < photos.length ? `${testPrefix}-${i}` : undefined}
          />
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div className="lf-hero-stage">
      <Column
        photos={HERO_LEFT}
        direction="up"
        paused={paused}
        reduceMotion={reduceMotion}
        testPrefix="landing-hero-img-left"
      />

      <div className="lf-hero-center">
        {HERO_PEEK.filter((p) => p.slot === "top").map((photo) => (
          <Tile
            key={photo.slot}
            photo={photo}
            testId="landing-hero-img-peek-top"
          />
        ))}
        {children}
        {HERO_PEEK.filter((p) => p.slot !== "top").map((photo) => (
          <Tile
            key={photo.slot}
            photo={photo}
            testId={`landing-hero-img-peek-${photo.slot}`}
          />
        ))}
      </div>

      <Column
        photos={HERO_RIGHT}
        direction="down"
        paused={paused}
        reduceMotion={reduceMotion}
        testPrefix="landing-hero-img-right"
      />

      <div className="lf-mobile-mosaic">
        {[...HERO_LEFT.slice(0, 2), ...HERO_RIGHT.slice(0, 2)].map((photo) => (
          <Tile
            key={`mobile-${photo.src}-${photo.tag}`}
            photo={photo}
            testId={`landing-hero-img-mobile-${photo.tag}`}
          />
        ))}
      </div>

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
