import { describe, it, expect, beforeEach } from "vitest";
import {
  extractDeadlineRaw,
  extractAmountRaw,
  buildRawScholarship,
} from "../heuristics";

describe("extractDeadlineRaw", () => {
  it("extracts Spanish date near deadline keyword", () => {
    const text = "Fecha límite: 31 de agosto de 2026. Más info en el sitio.";
    expect(extractDeadlineRaw(text)).toBe("31 de agosto de 2026");
  });

  it("extracts ISO date near deadline keyword", () => {
    const text = "El plazo de registro vence el 2026-12-15.";
    expect(extractDeadlineRaw(text)).toBe("2026-12-15");
  });

  it("extracts numeric date near keyword", () => {
    const text = "Cierre de la convocatoria: 30/06/2026";
    expect(extractDeadlineRaw(text)).toBe("30/06/2026");
  });

  it("falls back to first date in text when no keyword found", () => {
    const text = "Esta beca es para estudiantes mexicanos. Entrega antes del 15/03/2027.";
    expect(extractDeadlineRaw(text)).toBe("15/03/2027");
  });

  it("returns undefined when no date found", () => {
    const text = "Esta beca es para estudiantes mexicanos interesados en ciencia.";
    expect(extractDeadlineRaw(text)).toBeUndefined();
  });

  it("handles 'hasta el' keyword", () => {
    const text = "Aplica hasta el 15 de octubre de 2026.";
    expect(extractDeadlineRaw(text)).toBe("15 de octubre de 2026");
  });

  it("handles 'vence el' keyword", () => {
    const text = "La convocatoria vence el 2026-11-30.";
    expect(extractDeadlineRaw(text)).toBe("2026-11-30");
  });
});

describe("extractAmountRaw", () => {
  it("extracts a single peso amount", () => {
    const text = "Beca de $5,000 MXN al mes para estudiantes.";
    expect(extractAmountRaw(text)).toBe("$5,000 MXN");
  });

  it("extracts two amounts (max 2)", () => {
    const text = "Apoyos de $3,000 para materiales y $15,000 para manutención.";
    const result = extractAmountRaw(text);
    expect(result).toContain("$3,000");
    expect(result).toContain("$15,000");
  });

  it("returns undefined when no amount found", () => {
    const text = "Beca de viaje internacional para estudiantes mexicanos.";
    expect(extractAmountRaw(text)).toBeUndefined();
  });

  it("handles plain dollar amount without currency", () => {
    const text = "Apoyo económico de $2,500 mensuales.";
    expect(extractAmountRaw(text)).toBe("$2,500");
  });
});

describe("buildRawScholarship", () => {
  const futureYear = new Date().getFullYear() + 1;

  it("returns null when title is empty", () => {
    const result = buildRawScholarship({
      title: "",
      url: "https://becas.gob.mx/convocatoria",
      text: "Beca para estudiantes en México.",
    });
    expect(result).toBeNull();
  });

  it("returns null when content has no Mexico mention", () => {
    const result = buildRawScholarship({
      title: "International Scholarship 2026",
      url: "https://example.com/scholarship",
      text: "This scholarship is for students in the United States and Canada.",
    });
    expect(result).toBeNull();
  });

  it("returns null when detected deadline has already passed", () => {
    const result = buildRawScholarship({
      title: "Beca SECIHTI México 2020",
      url: "https://secihti.mx/beca",
      text: "Convocatoria para estudiantes de México. Fecha límite: 15/01/2020.",
    });
    expect(result).toBeNull();
  });

  it("builds a valid RawScholarship for a Mexican beca with future deadline", () => {
    const text = `Convocatoria de beca para estudiantes mexicanos de licenciatura.
      Fecha límite: 30 de noviembre de ${futureYear}.
      Apoyo de $5,000 MXN mensuales para gastos de manutención.`;

    const result = buildRawScholarship({
      title: "Beca Nacional para Licenciatura México",
      url: "https://becas.sep.gob.mx/convocatoria-2026",
      text,
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Beca Nacional para Licenciatura México");
    expect(result!.url).toBe("https://becas.sep.gob.mx/convocatoria-2026");
    expect(result!.countryRaw).toBe("México");
    expect(result!.deadlineRaw).toContain(String(futureYear));
    expect(result!.amountRaw).toBe("$5,000 MXN");
  });

  it("passes when Mexico is in title only (not in text)", () => {
    const result = buildRawScholarship({
      title: "Beca de posgrado México 2026",
      url: "https://secihti.mx/beca-posgrado",
      text: "Convocatoria abierta para postulantes de nivel maestría y doctorado.",
    });
    expect(result).not.toBeNull();
  });

  it("passes when URL is a .mx domain even with no Mexico in title/text", () => {
    const result = buildRawScholarship({
      title: "Chevening Scholarships 2026-2027",
      url: "https://www.secihti.mx/evento/convocatoria-chevening/",
      text: "Esta convocatoria es para estudiantes que deseen estudiar en el Reino Unido.",
    });
    // Should pass because domain is .mx
    expect(result).not.toBeNull();
  });

  it("passes for gob.mx domain URLs", () => {
    const result = buildRawScholarship({
      title: "Programa de Becas Bienestar 2026",
      url: "https://programasparaelbienestar.gob.mx/becas-bienestar/",
      text: "Becas para estudiantes de educación media superior.",
    });
    expect(result).not.toBeNull();
  });

  it("uses descriptionFallback for description when provided", () => {
    const result = buildRawScholarship({
      title: "Beca SECIHTI México",
      url: "https://secihti.mx/beca",
      text: "Texto de la convocatoria en México.",
      descriptionFallback: "Snippet corto de la búsqueda sobre esta beca.",
    });
    expect(result).not.toBeNull();
    expect(result!.descriptionRaw).toBe("Snippet corto de la búsqueda sobre esta beca.");
  });

  it("allows a beca with no detectable deadline (null deadline)", () => {
    const result = buildRawScholarship({
      title: "Beca abierta permanente México",
      url: "https://unam.mx/beca",
      text: "Beca para estudiantes de México sin fecha de cierre específica.",
    });
    expect(result).not.toBeNull();
    expect(result!.deadlineRaw).toBeUndefined();
  });
});
