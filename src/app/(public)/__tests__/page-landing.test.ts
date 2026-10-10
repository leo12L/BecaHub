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
});
