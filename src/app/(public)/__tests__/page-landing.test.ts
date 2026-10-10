import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("portada: consulta pública y piezas del boceto", () => {
  it("usa getLandingStripBecas y getLandingStats, no arma su propio filtro", () => {
    const src = readFileSync(join(here, "../page.tsx"), "utf8");

    expect(src).toContain("getLandingStripBecas");
    expect(src).toContain("getLandingStats");
    expect(src).not.toMatch(/status:\s*["']PENDING_REVIEW["']/);
    expect(src).not.toContain("filtroBecaPublica(");
    expect(src).not.toContain("cobe");
    expect(src).not.toContain("embla");
    expect(src).not.toContain("category-carousel");
    expect(src).not.toContain("ScholarshipVerticalCarousel");
    expect(src).not.toContain("AuthOptionsCard");
    expect(src).not.toContain("SocialProof");
  });

  it("getLandingStripBecas delega el filtro a getBecas", () => {
    const src = readFileSync(
      join(here, "../../../lib/becas/landing.ts"),
      "utf8",
    );
    expect(src).toContain("getBecas");
    expect(src).toContain("filtroBecaPublica");
    expect(src).not.toMatch(/status:\s*["']PENDING_REVIEW["']/);
    expect(src).not.toMatch(/where:\s*\{/);
    expect(src).not.toContain("countryDestination");
  });

  it("las tarjetas de tira leen destinationCountries, no countryDestination", () => {
    const cards = readFileSync(
      join(here, "../../../lib/becas/landing-cards.ts"),
      "utf8",
    );
    expect(cards).toContain("destinationCountries");
    expect(cards).not.toMatch(/\bcountryDestination\b/);
  });

  it("las dos fotos de los bloques existen en public/ y se referencian", () => {
    const blocks = readFileSync(
      join(here, "../../../components/landing/feature-blocks.tsx"),
      "utf8",
    );
    const files = [
      "estudiantes-colaborando.jpg",
      "estudiantes-aula.jpg",
    ] as const;

    for (const file of files) {
      expect(blocks).toContain(`/images/landing/${file}`);
      expect(
        existsSync(join(here, "../../../../public/images/landing", file)),
      ).toBe(true);
    }
    expect(blocks).toContain('loading="eager"');
  });

  it("las tiras son 4 y van a los lados, no un tablero central", () => {
    const strips = readFileSync(
      join(here, "../../../components/landing/scholarship-strips.tsx"),
      "utf8",
    );
    expect(strips).toContain("COLUMN_COUNT = 4");
    expect(strips).toContain('data-landing-cluster="left"');
    expect(strips).toContain('data-landing-cluster="right"');
    expect(strips).not.toContain("landing-strips-board");
  });

  it("la portada no usa esquinas redondeadas", () => {
    const files = [
      "../page.tsx",
      "../../../components/landing/landing-navbar.tsx",
      "../../../components/landing/hero-section.tsx",
      "../../../components/landing/strip-card.tsx",
      "../../../components/landing/feature-blocks.tsx",
      "../../../components/landing/how-it-works.tsx",
      "../../../components/landing/landing-footer.tsx",
    ];
    for (const file of files) {
      const src = readFileSync(join(here, file), "utf8");
      expect(src, file).not.toMatch(
        /rounded-(?:sm|md|lg|xl|2xl|3xl|4xl|full)\b/,
      );
    }
  });
});
