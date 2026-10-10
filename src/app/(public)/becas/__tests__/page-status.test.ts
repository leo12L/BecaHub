import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { queryListadoPublico } from "@/lib/becas/publica";

const here = dirname(fileURLToPath(import.meta.url));

describe("/becas no acepta ?status", () => {
  it("queryListadoPublico ignora DRAFT y PENDING_REVIEW", () => {
    expect(queryListadoPublico({ status: "DRAFT" }).status).toBeUndefined();
    expect(
      queryListadoPublico({ status: "PENDING_REVIEW" }).status,
    ).toBeUndefined();
    expect(queryListadoPublico({ status: "CLOSED" }).status).toBeUndefined();
  });

  it("la página usa queryListadoPublico (falla si /becas vuelve a pasar status)", () => {
    const src = readFileSync(join(here, "../page.tsx"), "utf8");
    expect(src).toContain("queryListadoPublico");
  });

  it("el filter-panel no ofrece selector de estado", () => {
    const src = readFileSync(
      join(here, "../../../../components/scholarships/filter-panel.tsx"),
      "utf8",
    );
    expect(src).not.toContain("STATUS_OPTIONS");
    expect(src).not.toContain('valueFor("status")');
    expect(src).not.toMatch(/<Label>Estado<\/Label>/);
  });
});
