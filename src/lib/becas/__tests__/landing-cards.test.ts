import { describe, expect, it } from "vitest";
import {
  EXAMPLE_LANDING_BECAS,
  MIN_LANDING_STRIP_CARDS,
  buildLandingStripCards,
  countPublicLandingCards,
  destinationCountriesLabel,
  splitIntoColumns,
  type LandingBecaInput,
} from "../landing-cards";

function fakePublica(
  overrides: Partial<LandingBecaInput> = {},
): LandingBecaInput {
  return {
    id: overrides.id ?? "beca-1",
    slug: overrides.slug ?? "beca-1",
    title: overrides.title ?? "Beca pública de prueba",
    status: overrides.status ?? "ACTIVE",
    coverageType: overrides.coverageType ?? "MONETARY",
    amountMin: overrides.amountMin ?? 1000,
    amountMax: overrides.amountMax ?? 2000,
    currency: overrides.currency ?? "MXN",
    academicLevel: overrides.academicLevel ?? "UNDERGRAD",
    destinationCountries: overrides.destinationCountries ?? ["MX"],
    deadline: overrides.deadline ?? new Date("2027-06-01"),
    source: overrides.source ?? { name: "SECIHTI" },
  };
}

describe("buildLandingStripCards", () => {
  it("rellena con ejemplos hasta 12 cuando hay menos becas públicas", () => {
    const cards = buildLandingStripCards([
      fakePublica(),
      fakePublica({ id: "b2", slug: "b2" }),
    ]);

    expect(cards).toHaveLength(MIN_LANDING_STRIP_CARDS);
    expect(countPublicLandingCards(cards)).toBe(2);
    expect(cards.filter((c) => c.kind === "example")).toHaveLength(10);
    expect(
      cards.filter((c) => c.kind === "example").every((c) => !c.href),
    ).toBe(true);
  });

  it("no inventa ejemplos cuando ya hay 12 o más becas públicas", () => {
    const becas = Array.from({ length: 15 }, (_, i) =>
      fakePublica({ id: `r-${i}`, slug: `r-${i}`, title: `Beca real ${i}` }),
    );
    const cards = buildLandingStripCards(becas);

    expect(cards).toHaveLength(MIN_LANDING_STRIP_CARDS);
    expect(cards.every((c) => c.kind === "real")).toBe(true);
    expect(countPublicLandingCards(cards)).toBe(12);
    expect(cards.every((c) => c.href?.startsWith("/becas/"))).toBe(true);
  });

  it("con cero becas públicas solo hay ejemplos y el conteo público es 0", () => {
    const cards = buildLandingStripCards([]);

    expect(cards).toHaveLength(MIN_LANDING_STRIP_CARDS);
    expect(countPublicLandingCards(cards)).toBe(0);
    expect(cards.every((c) => c.kind === "example")).toBe(true);
    expect(cards.map((c) => c.id)).toEqual(
      EXAMPLE_LANDING_BECAS.map((e) => e.id),
    );
  });

  it("las tarjetas de ejemplo se ven como ejemplo y no tienen enlace", () => {
    const [example] = buildLandingStripCards([]);
    expect(example.kind).toBe("example");
    expect(example.title).toMatch(/ejemplo/i);
    expect(example.href).toBeUndefined();
    expect(example.sourceName).toMatch(/ejemplo/i);
  });

  it("muestra destinos desde códigos ISO, no countryDestination", () => {
    const [card] = buildLandingStripCards([
      fakePublica({ destinationCountries: ["MX", "ES"] }),
    ]);
    expect(card.country).toBe("México, España");
    expect(destinationCountriesLabel([])).toBe("Sin destino");
    expect(destinationCountriesLabel(["JP"])).toBe("Japón");
  });
});

describe("splitIntoColumns", () => {
  it("reparte en columnas para las tiras", () => {
    const cols = splitIntoColumns([1, 2, 3, 4, 5], 3);
    expect(cols).toEqual([[1, 4], [2, 5], [3]]);
  });

  it("reparte 12 tarjetas en las 4 tiras del hero", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const cols = splitIntoColumns(items, 4);
    expect(cols.map((col) => col.length)).toEqual([3, 3, 3, 3]);
    expect(cols[0]).toEqual([1, 5, 9]);
    expect(cols[3]).toEqual([4, 8, 12]);
  });
});
