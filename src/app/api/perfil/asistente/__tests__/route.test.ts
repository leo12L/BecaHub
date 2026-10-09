import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";
import * as nextAuth from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/ai/profile-assistant", () => ({
  chatWithAssistant: vi.fn(),
  AiUnavailableError: class AiUnavailableError extends Error {},
  AiParseError: class AiParseError extends Error {},
}));

describe("POST /api/perfil/asistente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 sin sesión", async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/perfil/asistente",
      {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Se requiere autenticación");
  });

  it("devuelve 401 si la sesión no tiene user.id", async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue({
      user: {},
      expires: "2026-12-31",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/perfil/asistente",
      {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Se requiere autenticación");
  });
});
