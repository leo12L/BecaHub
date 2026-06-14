import { describe, it, expect } from "vitest";
import { parseSpanishDate, slugify, normalize } from "../normalize";

describe("parseSpanishDate", () => {
  it("parses ISO date", () => {
    const d = parseSpanishDate("2026-08-15");
    expect(d).toBeInstanceOf(Date);
    // Use UTC accessors — new Date("YYYY-MM-DD") creates a UTC midnight date
    expect(d!.getUTCFullYear()).toBe(2026);
    expect(d!.getUTCMonth()).toBe(7); // 0-indexed → August
    expect(d!.getUTCDate()).toBe(15);
  });

  it("parses dd/mm/yyyy", () => {
    const d = parseSpanishDate("31/12/2026");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(11); // December
    expect(d!.getDate()).toBe(31);
  });

  it("parses dd-mm-yyyy", () => {
    const d = parseSpanishDate("01-03-2027");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2027);
  });

  it("parses Spanish date format", () => {
    const d = parseSpanishDate("30 de noviembre de 2026");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(10); // November
    expect(d!.getDate()).toBe(30);
  });

  it("parses Spanish date without accents", () => {
    const d = parseSpanishDate("15 de octubre de 2026");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getMonth()).toBe(9); // October
  });

  it("returns null for unrecognized format", () => {
    expect(parseSpanishDate("some random text")).toBeNull();
    expect(parseSpanishDate("")).toBeNull();
    expect(parseSpanishDate("not a date at all")).toBeNull();
    expect(parseSpanishDate("convocatoria 2026")).toBeNull();
  });
});

describe("slugify", () => {
  it("converts title to slug", () => {
    expect(slugify("Beca Nacional para Licenciatura")).toBe(
      "beca-nacional-para-licenciatura",
    );
  });

  it("removes accents", () => {
    expect(slugify("Convocatoria de Becas SECIHTI México")).toBe(
      "convocatoria-de-becas-secihti-mexico",
    );
  });

  it("removes special characters", () => {
    expect(slugify("Beca 2026 (UNAM) - Posgrado")).toBe("beca-2026-unam-posgrado");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Beca   UNAM")).toBe("beca-unam");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("normalize", () => {
  const minimalRaw = {
    title: "Beca Nacional México",
    url: "https://secihti.mx/beca",
    descriptionRaw: "Apoyo para estudiantes",
    deadlineRaw: undefined,
    amountRaw: undefined,
    countryRaw: "México",
    levelRaw: "maestría",
    coverageRaw: "manutencion",
    languageRaw: "es",
  };

  it("returns null for empty title", () => {
    expect(normalize({ ...minimalRaw, title: "" }, "source-1")).toBeNull();
  });

  it("returns null for empty url", () => {
    expect(normalize({ ...minimalRaw, url: "" }, "source-1")).toBeNull();
  });

  it("creates a normalized scholarship with correct status", () => {
    const result = normalize(minimalRaw, "source-1");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("PENDING_REVIEW");
    expect(result!.isVerified).toBe(false);
  });

  it("maps academic level from Spanish text", () => {
    const result = normalize({ ...minimalRaw, levelRaw: "maestría y doctorado" }, "src");
    expect(result!.academicLevel).toBe("GRAD");
  });

  it("maps coverage type from keyword", () => {
    const result = normalize({ ...minimalRaw, coverageRaw: "beca completa con manutención" }, "src");
    expect(result!.coverageType).toBe("FULL");
  });

  it("parses amount range correctly", () => {
    const result = normalize(
      { ...minimalRaw, amountRaw: "$3,000 $8,000" },
      "src",
    );
    expect(result!.amountMin).toBe(3000);
    expect(result!.amountMax).toBe(8000);
  });

  it("generates a slug from the title", () => {
    const result = normalize(minimalRaw, "source-1");
    expect(result!.slug).toBe("beca-nacional-mexico");
  });

  it("sets sourceId correctly", () => {
    const result = normalize(minimalRaw, "test-source-id");
    expect(result!.sourceId).toBe("test-source-id");
  });
});
