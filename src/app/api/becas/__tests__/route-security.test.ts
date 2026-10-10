/**
 * Tests de seguridad para la API pública GET /api/becas.
 *
 * Verifica que:
 * - La API rechaza ?status=DRAFT con 400
 * - La API rechaza ?status=PENDING_REVIEW con 400
 * - La API rechaza ?status=CLOSED con 400
 * - La API acepta ?status=ACTIVE o sin status
 */

import { describe, it, expect } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/becas - seguridad de status", () => {
  function createRequest(
    searchParams: Record<string, string> = {},
  ): NextRequest {
    const url = new URL("http://localhost:3000/api/becas");
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  }

  it("debe aceptar sin parámetro status (defaults a ACTIVE)", async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
  });

  it("debe aceptar status=ACTIVE", async () => {
    const request = createRequest({ status: "ACTIVE" });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("data");
  });

  it("debe rechazar status=DRAFT con 400", async () => {
    const request = createRequest({ status: "DRAFT" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("solo muestra becas activas");
  });

  it("debe rechazar status=PENDING_REVIEW con 400", async () => {
    const request = createRequest({ status: "PENDING_REVIEW" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("solo muestra becas activas");
  });

  it("debe rechazar status=CLOSED con 400", async () => {
    const request = createRequest({ status: "CLOSED" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("solo muestra becas activas");
  });

  it("debe rechazar status inválido con 400 (validación Zod)", async () => {
    const request = createRequest({ status: "INVALID" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});
