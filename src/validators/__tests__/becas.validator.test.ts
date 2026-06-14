import { describe, it, expect } from "vitest";
import { becasQuerySchema } from "../becas.validator";

describe("becasQuerySchema", () => {
  it("parses empty object with defaults", () => {
    const result = becasQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.status).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it("coerces page and limit from strings", () => {
    const result = becasQuerySchema.parse({ page: "2", limit: "10" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("accepts valid status values", () => {
    const statuses = ["ACTIVE", "CLOSED", "DRAFT", "PENDING_REVIEW"] as const;
    for (const status of statuses) {
      const result = becasQuerySchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() => becasQuerySchema.parse({ status: "INVALID" })).toThrow();
  });

  it("accepts valid academic levels", () => {
    const result = becasQuerySchema.parse({ level: "UNDERGRAD" });
    expect(result.level).toBe("UNDERGRAD");
  });

  it("rejects invalid academic level", () => {
    expect(() => becasQuerySchema.parse({ level: "KINDERGARTEN" })).toThrow();
  });

  it("enforces limit max of 100", () => {
    expect(() => becasQuerySchema.parse({ limit: "200" })).toThrow();
  });

  it("enforces limit min of 1", () => {
    expect(() => becasQuerySchema.parse({ limit: "0" })).toThrow();
  });

  it("enforces page min of 1", () => {
    expect(() => becasQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("parses search string", () => {
    const result = becasQuerySchema.parse({ search: "UNAM" });
    expect(result.search).toBe("UNAM");
  });

  it("rejects search string over 200 chars", () => {
    const long = "a".repeat(201);
    expect(() => becasQuerySchema.parse({ search: long })).toThrow();
  });

  it("parses country filter", () => {
    const result = becasQuerySchema.parse({ country: "México" });
    expect(result.country).toBe("México");
  });

  it("parses deadlineBefore as date", () => {
    const result = becasQuerySchema.parse({ deadlineBefore: "2026-12-31" });
    expect(result.deadlineBefore).toBeInstanceOf(Date);
  });
});
