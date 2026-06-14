import { describe, it, expect } from "vitest";
import { formatAmount, getDeadlineInfo, formatDate } from "../format";

describe("formatAmount", () => {
  it("returns null when both amounts are null", () => {
    expect(formatAmount(null, null, "MXN")).toBeNull();
  });

  it("returns null when both amounts are undefined", () => {
    expect(formatAmount(undefined, undefined, "MXN")).toBeNull();
  });

  it("formats a single min amount", () => {
    const result = formatAmount(5000, null, "MXN");
    expect(result).toBe("$5,000 MXN");
  });

  it("formats a single max amount when min is null", () => {
    const result = formatAmount(null, 10000, "USD");
    expect(result).toBe("$10,000 USD");
  });

  it("formats a range when min and max differ", () => {
    const result = formatAmount(3000, 8000, "MXN");
    expect(result).toBe("$3,000 - $8,000 MXN");
  });

  it("formats a single amount when min equals max", () => {
    const result = formatAmount(5000, 5000, "MXN");
    expect(result).toBe("$5,000 MXN");
  });

  it("handles string number inputs", () => {
    const result = formatAmount("2500", "7500", "EUR");
    expect(result).toBe("$2,500 - $7,500 EUR");
  });
});

describe("getDeadlineInfo", () => {
  it("returns 'Cerrada' for CLOSED status regardless of deadline", () => {
    const info = getDeadlineInfo(new Date("2099-01-01"), "CLOSED");
    expect(info.label).toBe("Cerrada");
    expect(info.variant).toBe("closed");
  });

  it("returns muted variant when no deadline", () => {
    const info = getDeadlineInfo(null, "ACTIVE");
    expect(info.label).toBe("Sin fecha límite");
    expect(info.variant).toBe("muted");
  });

  it("returns muted variant for undefined deadline", () => {
    const info = getDeadlineInfo(undefined, "ACTIVE");
    expect(info.variant).toBe("muted");
  });

  it("returns urgent variant for deadline within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const info = getDeadlineInfo(soon, "ACTIVE");
    expect(info.variant).toBe("urgent");
  });

  it("returns warning variant for deadline within 30 days", () => {
    const soonish = new Date();
    soonish.setDate(soonish.getDate() + 20);
    const info = getDeadlineInfo(soonish, "ACTIVE");
    expect(info.variant).toBe("warning");
  });

  it("returns default variant for deadline beyond 30 days", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 60);
    const info = getDeadlineInfo(farFuture, "ACTIVE");
    expect(info.variant).toBe("default");
  });

  it("accepts string dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    const info = getDeadlineInfo(future.toISOString(), "ACTIVE");
    expect(info.variant).toBe("default");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2026-08-15T00:00:00Z");
    const result = formatDate(date);
    expect(result).toMatch(/2026/);
  });

  it("formats a string date", () => {
    const result = formatDate("2026-06-30");
    expect(result).toMatch(/2026/);
  });

  it("includes the month name in Spanish", () => {
    const result = formatDate(new Date("2026-08-15T12:00:00Z"));
    // Should contain 'agosto' in es-MX locale
    expect(result.toLowerCase()).toMatch(/agosto|agos/);
  });
});
