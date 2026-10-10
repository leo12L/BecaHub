import { describe, it, expect } from "vitest";
import { BecaCandidataSchema } from "@/lib/ingesta/types";

describe("Ingesta - País no detectado", () => {
  it("beca sin país detectado NO se guarda como México (destinationCountries vacío)", () => {
    // Simular una beca cuyo campo de destino no es reconocible
    const becaCandidata = {
      title: "Beca Internacional Sin País Específico",
      description: "Programa de investigación global sin destino definido",
      applyUrl: "https://ejemplo.org/beca-global",
      deadline: "2027-12-31 23:59:00",
      amount: "$10,000 USD",
      coverageType: "RESEARCH",
      academicLevel: "PHD",
      countryDestination: null, // No se detectó país
      language: "Inglés",
      convocante: "ONU",
      rawData: { source: "test" },
    };

    const result = BecaCandidataSchema.safeParse(becaCandidata);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.countryDestination).toBeNull();
    }
  });

  it("beca con país no reconocido NO se guarda como México", () => {
    // País inventado que no existe en el mapeo
    const becaCandidata = {
      title: "Beca en Narnia",
      description: "Programa ficticio",
      applyUrl: "https://ejemplo.org/narnia",
      deadline: "2027-12-31 23:59:00",
      amount: "$5,000",
      coverageType: "FULL",
      academicLevel: "UNDERGRAD",
      countryDestination: "Narnia", // País no reconocido
      language: "Narniano",
      convocante: "Reino de Narnia",
      rawData: { source: "test" },
    };

    const result = BecaCandidataSchema.safeParse(becaCandidata);
    expect(result.success).toBe(true);

    if (result.success) {
      // El país no reconocido se mantiene tal cual en la estructura intermedia
      // La conversión a array vacío + validationErrors ocurre al guardar en DB
      expect(result.data.countryDestination).toBe("Narnia");
    }
  });

  it("beca con string vacío en país NO se convierte a México", () => {
    const becaCandidata = {
      title: "Beca Sin Destino",
      description: "Sin país especificado",
      applyUrl: "https://ejemplo.org/sin-pais",
      deadline: "2027-12-31 23:59:00",
      amount: null,
      coverageType: null,
      academicLevel: null,
      countryDestination: "", // String vacío
      language: null,
      convocante: "Test",
      rawData: { source: "test" },
    };

    const result = BecaCandidataSchema.safeParse(becaCandidata);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.countryDestination).toBe("");
      // No debe ser "México" por defecto
    }
  });
});
