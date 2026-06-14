import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../auth";

describe("hashPassword", () => {
  it("returns a non-empty string", () => {
    const hash = hashPassword("mypassword123");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("contains a colon separating salt and hash", () => {
    const stored = hashPassword("test");
    const parts = stored.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBeTruthy();
    expect(parts[1]).toBeTruthy();
  });

  it("produces different hashes for the same password (different salts)", () => {
    const h1 = hashPassword("samepassword");
    const h2 = hashPassword("samepassword");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", () => {
    const stored = hashPassword("correctpassword");
    expect(verifyPassword("correctpassword", stored)).toBe(true);
  });

  it("returns false for an incorrect password", () => {
    const stored = hashPassword("correctpassword");
    expect(verifyPassword("wrongpassword", stored)).toBe(false);
  });

  it("returns false for an empty password against a real hash", () => {
    const stored = hashPassword("correctpassword");
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("returns false for an invalid stored format (no colon)", () => {
    expect(verifyPassword("anypassword", "invalidstoredformat")).toBe(false);
  });

  it("returns false for empty stored string", () => {
    expect(verifyPassword("anypassword", "")).toBe(false);
  });

  it("handles unicode passwords correctly", () => {
    const stored = hashPassword("contraseña123");
    expect(verifyPassword("contraseña123", stored)).toBe(true);
    expect(verifyPassword("contrasena123", stored)).toBe(false);
  });
});
