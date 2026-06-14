import { describe, it, expect } from "vitest";
import { MEXICO_PATTERN } from "../geo";

describe("MEXICO_PATTERN", () => {
  it("matches 'México' with accent", () => {
    expect(MEXICO_PATTERN.test("Beca para estudiantes de México")).toBe(true);
  });

  it("matches 'Mexico' without accent", () => {
    expect(MEXICO_PATTERN.test("Scholarship for students in Mexico")).toBe(true);
  });

  it("matches 'mexicano'", () => {
    expect(MEXICO_PATTERN.test("Apoyo para el estudiante mexicano")).toBe(true);
  });

  it("matches 'mexicana'", () => {
    expect(MEXICO_PATTERN.test("Convocatoria de la Universidad mexicana")).toBe(true);
  });

  it("matches standalone 'mx'", () => {
    expect(MEXICO_PATTERN.test("Ver más en gob.mx")).toBe(true);
  });

  it("does not match 'mx' inside a word", () => {
    // MEXICO_PATTERN uses \\bmx\\b so 'complex' should not match
    expect(MEXICO_PATTERN.test("This is a complex problem")).toBe(false);
  });

  it("does not match unrelated text", () => {
    expect(MEXICO_PATTERN.test("Scholarship for students in Canada and USA")).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(MEXICO_PATTERN.test("MEXICO")).toBe(true);
    expect(MEXICO_PATTERN.test("MEXICANO")).toBe(true);
  });
});
