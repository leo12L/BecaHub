import { describe, it, expect } from "vitest";
import { parseCountryDestination } from "@/lib/geo";

describe("Country destination migration", () => {
  it('should map "México" to ["MX"]', () => {
    const result = parseCountryDestination("México");
    expect(result).toEqual(["MX"]);
  });

  it('should map "Mexico" (without accent) to ["MX"]', () => {
    const result = parseCountryDestination("Mexico");
    expect(result).toEqual(["MX"]);
  });

  it('should map "Estados Unidos" to ["US"]', () => {
    const result = parseCountryDestination("Estados Unidos");
    expect(result).toEqual(["US"]);
  });

  it('should map "USA" to ["US"]', () => {
    const result = parseCountryDestination("USA");
    expect(result).toEqual(["US"]);
  });

  it('should map "España" to ["ES"]', () => {
    const result = parseCountryDestination("España");
    expect(result).toEqual(["ES"]);
  });

  it("should return empty array for unrecognized text", () => {
    const result = parseCountryDestination("País Imaginario XYZ");
    expect(result).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    const result = parseCountryDestination("");
    expect(result).toEqual([]);
  });

  describe("Migration scenarios matching SQL patterns", () => {
    it('should handle "MX" code directly', () => {
      expect(parseCountryDestination("MX")).toEqual(["MX"]);
    });

    it('should handle "mx" lowercase', () => {
      expect(parseCountryDestination("mx")).toEqual(["MX"]);
    });

    it('should handle "US" code directly', () => {
      expect(parseCountryDestination("US")).toEqual(["US"]);
    });

    it('should handle "España" with ñ', () => {
      expect(parseCountryDestination("España")).toEqual(["ES"]);
    });

    it('should handle "Espana" without ñ', () => {
      expect(parseCountryDestination("espana")).toEqual(["ES"]);
    });

    it("should handle multiple countries", () => {
      expect(parseCountryDestination("México y España")).toEqual([
        "MX",
        "ES",
      ]);
    });

    it("should handle countries with commas", () => {
      expect(parseCountryDestination("Estados Unidos, Canadá, México")).toEqual(
        ["US", "CA", "MX"],
      );
    });
  });

  describe("Edge cases that should result in empty array + validationError", () => {
    const unrecognizedInputs = [
      "Países Bajos Antillanos", // Not in our mapping
      "Unión Europea", // Not a country
      "123456", // Numbers
      "???", // Special characters only
      "North America", // Region name, not country
    ];

    unrecognizedInputs.forEach((input) => {
      it(`should return empty array for unrecognized input: "${input}"`, () => {
        const result = parseCountryDestination(input);
        expect(result).toEqual([]);
      });
    });
  });
});
