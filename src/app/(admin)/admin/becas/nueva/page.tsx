import { db } from "@/lib/db";
import { BecaForm } from "@/components/admin/beca-form";

export default async function NuevaBecaPage() {
  const [sources, categories] = await Promise.all([
    db.source.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const manualSource = sources.find((s) => s.type === "MANUAL");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Agregar beca</h1>
        <p className="text-muted-foreground text-sm">
          Pega el texto de la convocatoria, deja que la IA pre-llene los campos,
          y verifica el link oficial antes de publicar.
        </p>
      </div>
      <BecaForm
        sources={sources.map((s) => ({ id: s.id, name: s.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          axis: c.axis,
        }))}
        defaultSourceId={manualSource?.id ?? sources[0]?.id ?? ""}
      />
    </div>
  );
}
