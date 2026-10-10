import { describe, it, expect, vi, beforeEach } from "vitest";
import { SECIHTILector } from "../fuentes/secihti";
import { JinaLector } from "../fuentes/jina";
import fs from "fs";
import path from "path";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("SECIHTI Lector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe normalizar respuesta de SECIHTI correctamente", () => {
    const lector = new SECIHTILector();

    const mockResponse = [
      {
        id: 12345,
        title: { rendered: "Convocatoria de Investigación 2026" },
        link: "https://secihti.mx/convocatoria/test",
        acf: {
          titulo_resumido: "Investigación 2026",
          conv_year: 2026,
          fechas: {
            conclusion: "2026-12-31 23:59:00",
            solicitudes: "2026-10-01 00:00:00",
          },
          docs_convocatoria: "https://secihti.mx/doc.pdf",
          categorias: [265, 266],
        },
      },
    ];

    const becas = lector.normalizar(mockResponse);

    expect(becas).toHaveLength(1);
    expect(becas[0]?.title).toBe("Convocatoria de Investigación 2026");
    expect(becas[0]?.applyUrl).toBe("https://secihti.mx/convocatoria/test");
    expect(becas[0]?.deadline).toBe("2026-12-31 23:59:00");
    expect(becas[0]?.convocante).toBe("SECIHTI");
    expect(becas[0]?.countryDestination).toBeNull();
  });

  it("debe omitir items sin título", () => {
    const lector = new SECIHTILector();

    const mockResponse = [
      {
        id: 12345,
        title: { rendered: "" },
        link: "https://secihti.mx/convocatoria/test",
        acf: {},
      },
    ];

    const becas = lector.normalizar(mockResponse);
    expect(becas).toHaveLength(0);
  });

  it("debe omitir items sin URL", () => {
    const lector = new SECIHTILector();

    const mockResponse = [
      {
        id: 12345,
        title: { rendered: "Test" },
        link: "",
        acf: {},
      },
    ];

    const becas = lector.normalizar(mockResponse);
    expect(becas).toHaveLength(0);
  });

  it("debe limpiar HTML del título", () => {
    const lector = new SECIHTILector();

    const mockResponse = [
      {
        id: 12345,
        title: { rendered: "<p>Beca&nbsp;Nacional</p>" },
        link: "https://secihti.mx/test",
        acf: {},
      },
    ];

    const becas = lector.normalizar(mockResponse);
    expect(becas[0]?.title).toBe("Beca Nacional");
  });
});

describe("Jina Lector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe parsear markdown de Jina Reader correctamente", () => {
    const lector = new JinaLector();

    const mockData = [
      {
        url: "https://example.com",
        content: `
Title: Becas 2026

URL Source: https://example.com/becas

## Beca de Investigación

**Fecha límite:** 15 de diciembre de 2026

**Monto:** $10,000 MXN mensuales

**Dirigido a:** Estudiantes de posgrado

Para más información: https://example.com/beca1

## Beca de Movilidad

**Fecha de cierre:** 30 de noviembre de 2026

**Cobertura:** Completa

Más detalles en: https://example.com/beca2
        `,
      },
    ];

    const becas = lector.normalizar(mockData);

    expect(becas).toHaveLength(2);

    const beca1 = becas[0];
    expect(beca1?.title).toBe("Beca de Investigación");
    expect(beca1?.deadline).toContain("diciembre");
    expect(beca1?.amount).toContain("10,000");
    expect(beca1?.applyUrl).toBe("https://example.com/beca1");

    const beca2 = becas[1];
    expect(beca2?.title).toBe("Beca de Movilidad");
    expect(beca2?.deadline).toContain("noviembre");
    expect(beca2?.applyUrl).toBe("https://example.com/beca2");
  });

  it("debe manejar secciones sin URL específica", () => {
    const lector = new JinaLector();

    const mockData = [
      {
        url: "https://example.com/becas",
        content: `
URL Source: https://example.com/becas

## Beca Sin URL

**Fecha límite:** 15 de diciembre de 2026

Información de la beca sin URL específica.
        `,
      },
    ];

    const becas = lector.normalizar(mockData);

    expect(becas).toHaveLength(1);
    expect(becas[0]?.applyUrl).toBe("https://example.com/becas");
  });

  it("debe omitir secciones sin título", () => {
    const lector = new JinaLector();

    const mockData = [
      {
        url: "https://example.com",
        content: `
URL Source: https://example.com

##
        `,
      },
    ];

    const becas = lector.normalizar(mockData);
    expect(becas).toHaveLength(0);
  });
});

describe("Fixtures", () => {
  it("fixture de SECIHTI debe existir y ser válido JSON", () => {
    const fixturePath = path.join(
      process.cwd(),
      "fixtures",
      "secihti-response.json",
    );

    expect(fs.existsSync(fixturePath)).toBe(true);

    const content = fs.readFileSync(fixturePath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();

    const data = JSON.parse(content);
    expect(Array.isArray(data)).toBe(true);
  });

  it("fixture de Jina debe existir", () => {
    const fixturePath = path.join(
      process.cwd(),
      "fixtures",
      "jina-response.txt",
    );

    expect(fs.existsSync(fixturePath)).toBe(true);

    const content = fs.readFileSync(fixturePath, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });
});
