import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const landingDir = join(here, "../../../components/landing");
const photosDir = join(here, "../../../../public/images/landing");

function readLanding(file: string) {
  return readFileSync(join(landingDir, file), "utf8");
}

describe("portada: diseño de referencia y consulta pública", () => {
  it("la portada no consulta becas ni arma un filtro propio", () => {
    const src = readFileSync(join(here, "../page.tsx"), "utf8");

    expect(src).toContain("landing-ref");
    expect(src).toContain("HeroSection");
    expect(src).toContain("DiscoverSection");
    expect(src).toContain("PrepareSection");
    expect(src).toContain("StepsSection");
    expect(src).not.toContain("getLandingStripBecas");
    expect(src).not.toContain("getLandingStats");
    expect(src).not.toContain("ScholarshipStrips");
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

  it("las fotos locales existen y el collage las carga eager", () => {
    const photos = readLanding("landing-photos.ts");
    const collage = readLanding("hero-collage.tsx");
    const files = [
      "hero-laptop.jpg",
      "hero-cafe.jpg",
      "hero-mesa.jpg",
      "hero-grupo.jpg",
      "hero-libros.jpg",
      "prepare-laptop.jpg",
      "estudiantes-colaborando.jpg",
      "carousel-cursos.jpg",
      "estudiantes-aula.jpg",
      "prepare-notas.jpg",
    ] as const;

    for (const file of files) {
      expect(photos).toContain(`/images/landing/${file}`);
      expect(existsSync(join(photosDir, file))).toBe(true);
    }
    expect(collage).toContain('loading="eager"');
    expect(collage).toContain("Pausar carrusel");
    expect(photos).not.toContain("pexels");
  });

  it("el hero enfatiza 'no' y no muestra tiras ni contadores", () => {
    const hero = readLanding("hero-section.tsx");
    expect(hero).toContain("<em>no</em>");
    expect(hero).toContain("Encuentra las becas de las que");
    expect(hero).not.toContain("ScholarshipStrips");
    expect(hero).not.toContain("stat-convocatorias");
    expect(hero).not.toContain("getLandingStats");
  });

  it("la barra y las secciones usan las rutas y copys de la referencia", () => {
    const nav = readLanding("landing-navbar.tsx");
    expect(nav).toContain("Descubre");
    expect(nav).toContain("Cómo funciona");
    expect(nav).toContain("Nosotros");
    expect(nav).not.toContain("Prepárate");
    expect(nav).not.toContain("Comunidad");
    expect(nav).toContain('href="/becas"');
    expect(nav).toContain("Explorar becas");

    const discover = readLanding("discover-section.tsx");
    expect(discover).toContain("Oportunidades que mereces conocer.");
    expect(discover).toContain('id="descubre"');

    const prepare = readLanding("prepare-section.tsx");
    expect(prepare).toContain("El siguiente paso empieza contigo.");
    expect(prepare).toContain('id="preparate"');

    const steps = readLanding("steps-section.tsx");
    expect(steps).toContain("Encuentra lo que va contigo");
    expect(steps).toContain("Prepara tu siguiente paso");
    expect(steps).toContain("Envía tu postulación");
    expect(steps).toContain('id="como-funciona"');

    const footer = readLanding("landing-footer.tsx");
    expect(footer).toContain("Más oportunidades. Nuevos caminos.");
    expect(footer).toContain(
      "Prototipo visual. Las imágenes y categorías son ilustrativas.",
    );
    expect(footer).toContain("Instagram");
    expect(footer).toContain("LinkedIn");
    expect(footer).not.toContain("Facebook");
    expect(footer).not.toContain("Todas las becas");
    expect(footer).toContain('id="nosotros"');
  });

  it("el carrusel respeta prefers-reduced-motion", () => {
    const carousel = readLanding("photo-carousel.tsx");
    expect(carousel).toContain("prefers-reduced-motion");
    expect(carousel).toContain('loading="eager"');
  });
});
