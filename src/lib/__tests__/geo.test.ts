import { describe, it, expect } from "vitest";
import {
  MEXICO_PATTERN,
  countryNameToCode,
  parseCountryDestination,
  unrecognizedDestinationTokens,
  countryCodeToName,
  REGIONS,
  resolveDestinationCodes,
  destinationLabel,
} from "../geo";

describe("MEXICO_PATTERN", () => {
  it("matches 'México' with accent", () => {
    expect(MEXICO_PATTERN.test("Beca para estudiantes de México")).toBe(true);
  });

  it("matches 'Mexico' without accent", () => {
    expect(MEXICO_PATTERN.test("Scholarship for students in Mexico")).toBe(
      true,
    );
  });

  it("matches 'mexicano'", () => {
    expect(MEXICO_PATTERN.test("Apoyo para el estudiante mexicano")).toBe(true);
  });

  it("matches 'mexicana'", () => {
    expect(MEXICO_PATTERN.test("Convocatoria de la Universidad mexicana")).toBe(
      true,
    );
  });

  it("matches standalone 'mx'", () => {
    expect(MEXICO_PATTERN.test("Ver más en gob.mx")).toBe(true);
  });

  it("does not match 'mx' inside a word", () => {
    // MEXICO_PATTERN uses \\bmx\\b so 'complex' should not match
    expect(MEXICO_PATTERN.test("This is a complex problem")).toBe(false);
  });

  it("does not match unrelated text", () => {
    expect(
      MEXICO_PATTERN.test("Scholarship for students in Canada and USA"),
    ).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(MEXICO_PATTERN.test("MEXICO")).toBe(true);
    expect(MEXICO_PATTERN.test("MEXICANO")).toBe(true);
  });
});

describe("countryNameToCode", () => {
  it("maps 'México' to 'MX'", () => {
    expect(countryNameToCode("México")).toBe("MX");
  });

  it("maps 'Mexico' (without accent) to 'MX'", () => {
    expect(countryNameToCode("Mexico")).toBe("MX");
  });

  it("maps 'Estados Unidos' to 'US'", () => {
    expect(countryNameToCode("Estados Unidos")).toBe("US");
  });

  it("maps 'USA' to 'US'", () => {
    expect(countryNameToCode("USA")).toBe("US");
  });

  it("maps 'España' to 'ES'", () => {
    expect(countryNameToCode("España")).toBe("ES");
  });

  it("is case-insensitive", () => {
    expect(countryNameToCode("MÉXICO")).toBe("MX");
    expect(countryNameToCode("españa")).toBe("ES");
  });

  it("ignores whitespace", () => {
    expect(countryNameToCode("  México  ")).toBe("MX");
  });

  it("returns null for unrecognized country", () => {
    expect(countryNameToCode("País Imaginario")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(countryNameToCode("")).toBeNull();
  });
});

describe("parseCountryDestination", () => {
  it("parses 'México' to ['MX']", () => {
    expect(parseCountryDestination("México")).toEqual(["MX"]);
  });

  it("parses 'Mexico' to ['MX']", () => {
    expect(parseCountryDestination("Mexico")).toEqual(["MX"]);
  });

  it("parses 'Estados Unidos' to ['US']", () => {
    expect(parseCountryDestination("Estados Unidos")).toEqual(["US"]);
  });

  it("parses 'USA' to ['US']", () => {
    expect(parseCountryDestination("USA")).toEqual(["US"]);
  });

  it("parses 'España' to ['ES']", () => {
    expect(parseCountryDestination("España")).toEqual(["ES"]);
  });

  it("parses multiple countries separated by comma", () => {
    expect(parseCountryDestination("México, España, Estados Unidos")).toEqual([
      "MX",
      "ES",
      "US",
    ]);
  });

  it("parses multiple countries separated by 'y'", () => {
    expect(parseCountryDestination("España y Francia")).toEqual(["ES", "FR"]);
  });

  it("parses multiple countries separated by 'o'", () => {
    expect(parseCountryDestination("Canadá o Estados Unidos")).toEqual([
      "CA",
      "US",
    ]);
  });

  it("removes duplicates", () => {
    expect(parseCountryDestination("México, Mexico, MX")).toEqual(["MX"]);
  });

  it("returns empty array for unrecognized text", () => {
    expect(parseCountryDestination("País Imaginario")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseCountryDestination("")).toEqual([]);
  });

  it("filters out unrecognized countries", () => {
    expect(parseCountryDestination("México, País Falso, España")).toEqual([
      "MX",
      "ES",
    ]);
  });

  it("recorta tabs, saltos y NBSP", () => {
    expect(parseCountryDestination("\tCanadá\n")).toEqual(["CA"]);
    expect(parseCountryDestination("\u00A0México\u00A0")).toEqual(["MX"]);
  });

  it("deduplica España repetida (falla si se quita el Set)", () => {
    expect(parseCountryDestination("España, México, España")).toEqual([
      "ES",
      "MX",
    ]);
  });

  it("parte 'Holanda e Italia' y 'México u Honduras' no aplica a Honduras", () => {
    expect(parseCountryDestination("Holanda e Italia")).toEqual(["NL", "IT"]);
  });
});

describe("unrecognizedDestinationTokens", () => {
  it("avisa el país no reconocido dentro de una lista", () => {
    expect(unrecognizedDestinationTokens("México, Narnia")).toEqual(["Narnia"]);
  });
});

describe("countryCodeToName", () => {
  it("maps 'MX' to 'México'", () => {
    expect(countryCodeToName("MX")).toBe("México");
  });

  it("maps 'US' to 'Estados Unidos'", () => {
    expect(countryCodeToName("US")).toBe("Estados Unidos");
  });

  it("maps 'ES' to 'España'", () => {
    expect(countryCodeToName("ES")).toBe("España");
  });

  it("returns code itself for unrecognized code", () => {
    expect(countryCodeToName("XX")).toBe("XX");
  });
});

describe("REGIONS", () => {
  it("defines 'europa' with European countries", () => {
    expect(REGIONS.europa).toContain("ES");
    expect(REGIONS.europa).toContain("FR");
    expect(REGIONS.europa).toContain("DE");
  });

  it("defines 'latinoamérica' with Latin American countries", () => {
    expect(REGIONS.latinoamérica).toContain("MX");
    expect(REGIONS.latinoamérica).toContain("AR");
    expect(REGIONS.latinoamérica).toContain("BR");
  });

  it("defines 'asia' with Asian countries", () => {
    expect(REGIONS.asia).toContain("CN");
    expect(REGIONS.asia).toContain("JP");
    expect(REGIONS.asia).toContain("KR");
  });
});

describe("resolveDestinationCodes", () => {
  it("maps ISO country codes", () => {
    expect(resolveDestinationCodes("ES")).toEqual(["ES"]);
    expect(resolveDestinationCodes("mx")).toEqual(["MX"]);
  });

  it("maps region slugs to country codes", () => {
    expect(resolveDestinationCodes("europa")).toEqual(REGIONS.europa);
    expect(resolveDestinationCodes("latinoamerica")).toEqual(
      REGIONS.latinoamérica,
    );
  });

  it("returns null for unrecognized destinations", () => {
    expect(resolveDestinationCodes("Narnia")).toBeNull();
    expect(resolveDestinationCodes("")).toBeNull();
  });
});

describe("destinationLabel", () => {
  it("returns Spanish names for countries and regions", () => {
    expect(destinationLabel("ES")).toBe("España");
    expect(destinationLabel("europa")).toBe("Europa");
    expect(destinationLabel("CN")).toBe("China");
  });
});
