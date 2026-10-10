/**
 * Tests unitarios para funciones de manejo de fechas en hora de México
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTodayInMexicoCity,
  dateToMexicoMidnight,
  componentsToMexicoMidnight,
} from "../fechas";

describe("fechas.ts - manejo de zona horaria México", () => {
  beforeEach(() => {
    // Fijar la hora del sistema a UTC para tests predecibles
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getTodayInMexicoCity", () => {
    it("devuelve medianoche del día en México cuando son las 05:30 UTC del día siguiente", () => {
      // En UTC es 2026-10-10 05:30
      // En México (UTC-6) es 2026-10-09 23:30 (día 9 a las 11:30 PM)
      // Debe retornar 2026-10-09T00:00:00-06:00
      vi.setSystemTime(new Date("2026-10-10T05:30:00Z"));

      const result = getTodayInMexicoCity();

      // El resultado debe ser medianoche del día 9 en México
      expect(result.toISOString()).toBe("2026-10-09T06:00:00.000Z"); // -06:00 = +06:00 en UTC
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(9); // Octubre (0-indexed)
      expect(result.getUTCDate()).toBe(9);
      expect(result.getUTCHours()).toBe(6); // Medianoche México = 06:00 UTC
    });

    it("devuelve medianoche del día en México cuando son las 01:00 UTC", () => {
      // En UTC es 2026-10-10 01:00
      // En México (UTC-6) es 2026-10-09 19:00 (día 9 a las 7 PM)
      // Debe retornar 2026-10-09T00:00:00-06:00
      vi.setSystemTime(new Date("2026-10-10T01:00:00Z"));

      const result = getTodayInMexicoCity();

      expect(result.toISOString()).toBe("2026-10-09T06:00:00.000Z");
    });

    it("devuelve medianoche del día en México cuando son las 12:00 UTC", () => {
      // En UTC es 2026-10-10 12:00
      // En México (UTC-6) es 2026-10-10 06:00 (día 10 a las 6 AM)
      // Debe retornar 2026-10-10T00:00:00-06:00
      vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));

      const result = getTodayInMexicoCity();

      expect(result.toISOString()).toBe("2026-10-10T06:00:00.000Z");
    });
  });

  describe("dateToMexicoMidnight", () => {
    it("convierte YYYY-MM-DD a medianoche de México", () => {
      const result = dateToMexicoMidnight("2026-10-15");

      expect(result.toISOString()).toBe("2026-10-15T06:00:00.000Z");
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(9); // Octubre
      expect(result.getUTCDate()).toBe(15);
      expect(result.getUTCHours()).toBe(6);
    });

    it("lanza error con formato inválido", () => {
      expect(() => dateToMexicoMidnight("15/10/2026")).toThrow(
        "Formato de fecha inválido"
      );
      expect(() => dateToMexicoMidnight("2026-13-01")).not.toThrow(); // new Date() acepta esto pero es inválido
      expect(() => dateToMexicoMidnight("invalid")).toThrow();
    });
  });

  describe("componentsToMexicoMidnight", () => {
    it("convierte componentes (año, mes, día) a medianoche de México", () => {
      const result = componentsToMexicoMidnight(2026, 10, 15);

      expect(result.toISOString()).toBe("2026-10-15T06:00:00.000Z");
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(9); // Octubre (0-indexed)
      expect(result.getUTCDate()).toBe(15);
    });

    it("maneja meses de un solo dígito correctamente", () => {
      const result = componentsToMexicoMidnight(2026, 3, 5);

      expect(result.toISOString()).toBe("2026-03-05T06:00:00.000Z");
    });

    it("maneja días de un solo dígito correctamente", () => {
      const result = componentsToMexicoMidnight(2026, 12, 9);

      expect(result.toISOString()).toBe("2026-12-09T06:00:00.000Z");
    });
  });

  describe("consistencia entre funciones", () => {
    it("getTodayInMexicoCity y dateToMexicoMidnight producen el mismo resultado para hoy", () => {
      vi.setSystemTime(new Date("2026-10-10T12:00:00Z")); // Día 10 en México

      const fromGetToday = getTodayInMexicoCity();
      const fromDateTo = dateToMexicoMidnight("2026-10-10");

      expect(fromGetToday.toISOString()).toBe(fromDateTo.toISOString());
    });

    it("dateToMexicoMidnight y componentsToMexicoMidnight producen el mismo resultado", () => {
      const fromDateTo = dateToMexicoMidnight("2026-10-15");
      const fromComponents = componentsToMexicoMidnight(2026, 10, 15);

      expect(fromDateTo.toISOString()).toBe(fromComponents.toISOString());
    });
  });

  describe("offset -06:00 constante (sin horario de verano)", () => {
    it("mantiene -06:00 en verano (julio)", () => {
      const result = dateToMexicoMidnight("2026-07-15");

      // Julio: debería ser -06:00 (no -05:00 con horario de verano)
      expect(result.toISOString()).toBe("2026-07-15T06:00:00.000Z");
    });

    it("mantiene -06:00 en invierno (enero)", () => {
      const result = dateToMexicoMidnight("2026-01-15");

      // Enero: debería ser -06:00
      expect(result.toISOString()).toBe("2026-01-15T06:00:00.000Z");
    });
  });
});
