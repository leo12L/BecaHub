"use client";

import { useEffect, useState } from "react";

export type CarouselSlide = {
  src: string;
  alt: string;
  tag?: string;
};

export function PhotoCarousel({
  slides,
  testId,
}: {
  slides: CarouselSlide[];
  testId: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slide = slides[index] ?? slides[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!slide) return null;

  const go = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };

  return (
    <div data-testid={testId} data-landing-carousel>
      <figure className="lf-photo relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.alt}
          width={1200}
          height={800}
          loading="eager"
          decoding="async"
          className="lf-carousel-track"
          style={reduceMotion ? { transition: "none" } : undefined}
          data-testid={`${testId}-img`}
        />
        {slide.tag ? (
          <figcaption className="lf-tag lf-tag-green bottom-4 left-4">
            {slide.tag}
          </figcaption>
        ) : null}
      </figure>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="lf-square-btn"
            aria-label="Foto anterior"
            onClick={() => go(index - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className="lf-square-btn"
            aria-label="Foto siguiente"
            onClick={() => go(index + 1)}
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {slides.map((item, i) => (
              <span
                key={`${item.src}-${item.tag ?? i}`}
                className={`h-1.5 w-5 ${
                  i === index ? "bg-[var(--lf-green)]" : "bg-[var(--lf-line)]"
                }`}
              />
            ))}
          </div>
          <p
            className="text-xs tracking-widest text-[var(--lf-muted)]"
            aria-live="polite"
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
