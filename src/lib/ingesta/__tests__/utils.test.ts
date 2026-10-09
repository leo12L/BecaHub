import { describe, it, expect } from "vitest";
import {
  generateFingerprint,
  normalizeForFingerprint,
  validateBecaCandidata,
} from "../utils";
import type { BecaCandidata } from "../types";

describe("Ingesta Utils", () => {
  describe("normalizeForFingerprint", () => {
    it("debe quitar acentos", () => {
      expect(normalizeForFingerprint("Convocatoria México")).toBe(
        "convocatoria mexico",
      );
    });

    it("debe convertir a minúsculas", () => {
      expect(normalizeForFingerprint("BECA NACIONAL")).toBe("beca nacional");
    });

    it("debe colapsar espacios múltiples", () => {
      expect(normalizeForFingerprint("Beca   de    Investigación")).toBe(
        "beca de investigacion",
      );
    });

    it("debe quitar puntuación", () => {
      expect(normalizeForFingerprint("Beca 2026, México!")).toBe(
        "beca 2026 mexico",
      );
    });
  });

  describe("generateFingerprint", () => {
    it("debe generar fingerprint con título normalizado cuando hay año", () => {
      const beca: BecaCandidata = {
        title: "Beca de Investigación",
        description: "Test",
        applyUrl: "https://example.com",
        deadline: "2026-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: null,
      };

      const fingerprint = generateFingerprint(beca);
      expect(fingerprint).toContain("beca de investigacion");
      expect(fingerprint).toContain("2026");
    });

    it("debe retornar null si no hay deadline ni año de fuente", () => {
      const beca: BecaCandidata = {
        title: "Beca Sin Fecha",
        description: "Test",
        applyUrl: "https://example.com",
        deadline: null,
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: null,
      };

      const fingerprint = generateFingerprint(beca);
      expect(fingerprint).toBeNull();
    });

    it("debe incluir convocante normalizado en fingerprint con año de fuente", () => {
      const beca: BecaCandidata = {
        title: "Beca Nacional",
        description: "Test",
        applyUrl: "https://example.com",
        deadline: null,
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "SECIHTI",
      };

      const fingerprint = generateFingerprint(beca, 2026);
      expect(fingerprint).toContain("secihti");
      expect(fingerprint).toContain("2026");
    });

    it("debe incluir año en fingerprint", () => {
      const beca: BecaCandidata = {
        title: "Beca 2026",
        description: "Test",
        applyUrl: "https://example.com",
        deadline: "15 de diciembre de 2026",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: null,
      };

      const fingerprint = generateFingerprint(beca);
      expect(fingerprint).toContain("2026");
    });

    it("debe generar mismo fingerprint para becas similares con acentos diferentes", () => {
      const beca1: BecaCandidata = {
        title: "Beca de Investigación en México",
        description: "Test",
        applyUrl: "https://example.com/1",
        deadline: "2026-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "SECIHTI",
      };

      const beca2: BecaCandidata = {
        title: "BECA DE INVESTIGACION EN MEXICO",
        description: "Test",
        applyUrl: "https://example.com/2",
        deadline: "31/12/2026",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "secihti",
      };

      expect(generateFingerprint(beca1)).toBe(generateFingerprint(beca2));
    });
  });

  describe("validateBecaCandidata", () => {
    it("debe validar beca correcta", () => {
      const beca: BecaCandidata = {
        title: "Beca Nacional",
        description: "Descripción de la beca",
        applyUrl: "https://example.com/beca",
        deadline: "2026-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: null,
      };

      const result = validateBecaCandidata(beca);
      expect(result.valid).toBe(true);
      expect(result.beca).toEqual(beca);
    });

    it("debe fallar si falta el título", () => {
      const beca = {
        title: "",
        description: "Descripción",
        applyUrl: "https://example.com",
      };

      const result = validateBecaCandidata(beca);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("El título es requerido");
    });

    it("debe fallar si falta la descripción", () => {
      const beca = {
        title: "Beca",
        description: "",
        applyUrl: "https://example.com",
      };

      const result = validateBecaCandidata(beca);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("La descripción es requerida");
    });

    it("debe fallar si la URL es inválida", () => {
      const beca = {
        title: "Beca",
        description: "Descripción",
        applyUrl: "not-a-url",
      };

      const result = validateBecaCandidata(beca);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("La URL no es válida");
    });

    it("debe detectar formato de fecha inválido", () => {
      const beca = {
        title: "Beca",
        description: "Descripción",
        applyUrl: "https://example.com",
        deadline: "fecha inválida",
      };

      const result = validateBecaCandidata(beca);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Formato de fecha no reconocido");
    });
  });
});
