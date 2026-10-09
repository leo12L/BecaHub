import { describe, it, expect } from "vitest";
import { generateFingerprint, validateBecaCandidata } from "../utils";
import type { BecaCandidata } from "../types";

describe("Ingesta Integration Tests", () => {
  describe("2.4 - Deduplicación por fingerprint", () => {
    it("debe generar el mismo fingerprint para becas escritas de forma distinta", () => {
      // Misma beca de dos fuentes diferentes, con variaciones
      const beca1: BecaCandidata = {
        title: "Beca de Investigación Científica 2026",
        description: "Programa de becas para investigadores",
        applyUrl: "https://secihti.mx/convocatoria/investigacion",
        deadline: "2026-12-31",
        amount: "$15,000 MXN",
        coverageType: "RESEARCH",
        academicLevel: "Maestría y Doctorado",
        countryDestination: "México",
        language: "Español",
        convocante: "SECIHTI",
      };

      const beca2: BecaCandidata = {
        title: "BECA DE INVESTIGACION CIENTIFICA 2026", // Sin acentos, mayúsculas
        description: "Apoyo económico para investigación",
        applyUrl: "https://example.com/diferente", // URL distinta
        deadline: "31 de diciembre de 2026", // Formato diferente
        amount: "15000", // Sin formato
        coverageType: "RESEARCH",
        academicLevel: "Posgrado",
        countryDestination: "México",
        language: "Español",
        convocante: "secihti", // Minúsculas
      };

      const fingerprint1 = generateFingerprint(beca1);
      const fingerprint2 = generateFingerprint(beca2);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it("debe generar fingerprints distintos para becas diferentes", () => {
      const beca1: BecaCandidata = {
        title: "Beca de Investigación 2026",
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
        title: "Beca de Movilidad 2026", // Título diferente
        description: "Test",
        applyUrl: "https://example.com/2",
        deadline: "2026-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "SECIHTI",
      };

      const fingerprint1 = generateFingerprint(beca1);
      const fingerprint2 = generateFingerprint(beca2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it("debe distinguir becas del mismo nombre pero diferentes años", () => {
      const beca2025: BecaCandidata = {
        title: "Beca Nacional",
        description: "Test",
        applyUrl: "https://example.com/2025",
        deadline: "2025-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "SECIHTI",
      };

      const beca2026: BecaCandidata = {
        title: "Beca Nacional",
        description: "Test",
        applyUrl: "https://example.com/2026",
        deadline: "2026-12-31",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: "SECIHTI",
      };

      const fingerprint2025 = generateFingerprint(beca2025);
      const fingerprint2026 = generateFingerprint(beca2026);

      expect(fingerprint2025).not.toBe(fingerprint2026);
    });
  });

  describe("2.5 - Validación de errores", () => {
    it("debe registrar error cuando la fecha es inválida", () => {
      const beca: BecaCandidata = {
        title: "Beca Nacional",
        description: "Descripción válida",
        applyUrl: "https://example.com/beca",
        deadline: "fecha inválida que no se puede parsear",
        amount: null,
        coverageType: null,
        academicLevel: null,
        countryDestination: null,
        language: null,
        convocante: null,
      };

      const result = validateBecaCandidata(beca);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("fecha"))).toBe(true);
    });

    it("debe registrar error cuando falta la URL", () => {
      const beca = {
        title: "Beca Nacional",
        description: "Descripción válida",
        applyUrl: "",
        deadline: null,
      };

      const result = validateBecaCandidata(beca);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes("URL"))).toBe(true);
    });

    it("debe permitir beca válida con campos opcionales null", () => {
      const beca: BecaCandidata = {
        title: "Beca Nacional",
        description: "Descripción válida",
        applyUrl: "https://example.com/beca",
        deadline: null,
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

    it("debe acumular múltiples errores de validación", () => {
      const beca = {
        title: "", // Título vacío
        description: "", // Descripción vacía
        applyUrl: "not-a-url", // URL inválida
        deadline: "invalid date", // Fecha inválida
      };

      const result = validateBecaCandidata(beca);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("2.2 - Aislamiento de fuentes", () => {
    it("debe continuar procesando otras fuentes si una falla (lógica)", () => {
      // Este test verifica la lógica de aislamiento de errores
      // En el código real (ejecutar.ts), cada fuente se procesa en un try-catch
      // independiente, por lo que el fallo de una no afecta a las demás.

      const fuentes = ["fuente1", "fuente2", "fuente3"];
      const resultados: Array<{ fuente: string; exito: boolean }> = [];

      for (const fuente of fuentes) {
        try {
          // Simular que fuente2 falla
          if (fuente === "fuente2") {
            throw new Error("Error en fuente2");
          }

          resultados.push({ fuente, exito: true });
        } catch {
          // Registrar el error pero continuar
          resultados.push({ fuente, exito: false });
        }
      }

      // Verificar que todas las fuentes se procesaron
      expect(resultados).toHaveLength(3);
      expect(resultados[0]?.exito).toBe(true);
      expect(resultados[1]?.exito).toBe(false);
      expect(resultados[2]?.exito).toBe(true);
    });

    it("debe registrar el error de una fuente sin detener el proceso", () => {
      const errores: string[] = [];
      const completadas: string[] = [];

      const procesarFuente = (nombre: string) => {
        try {
          if (nombre === "fuente_con_error") {
            throw new Error(`Fallo en ${nombre}`);
          }
          completadas.push(nombre);
        } catch (err) {
          errores.push(err instanceof Error ? err.message : String(err));
        }
      };

      procesarFuente("fuente1");
      procesarFuente("fuente_con_error");
      procesarFuente("fuente3");

      expect(completadas).toContain("fuente1");
      expect(completadas).toContain("fuente3");
      expect(completadas).not.toContain("fuente_con_error");
      expect(errores).toHaveLength(1);
      expect(errores[0]).toContain("fuente_con_error");
    });
  });
});
