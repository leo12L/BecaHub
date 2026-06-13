import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BecaForm } from "@/components/admin/beca-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarBecaPage({ params }: PageProps) {
  const { id } = await params;

  const [scholarship, sources, categories] = await Promise.all([
    db.scholarship.findUnique({
      where: { id },
      include: { categories: { select: { categoryId: true } } },
    }),
    db.source.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!scholarship) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Editar beca</h1>
        <p className="text-muted-foreground text-sm">{scholarship.title}</p>
      </div>
      <BecaForm
        becaId={scholarship.id}
        sources={sources.map((s) => ({ id: s.id, name: s.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          axis: c.axis,
        }))}
        defaultSourceId={scholarship.sourceId}
        initial={{
          title: scholarship.title,
          description: scholarship.description,
          coverageType: scholarship.coverageType,
          academicLevel: scholarship.academicLevel,
          language: scholarship.language ?? "",
          amountMin: scholarship.amountMin?.toString() ?? "",
          amountMax: scholarship.amountMax?.toString() ?? "",
          currency: scholarship.currency,
          countryOrigin: scholarship.countryOrigin ?? "",
          countryDestination: scholarship.countryDestination,
          deadline: scholarship.deadline
            ? scholarship.deadline.toISOString().slice(0, 10)
            : "",
          applyUrl: scholarship.applyUrl,
          sourceId: scholarship.sourceId,
          categoryIds: scholarship.categories.map((c) => c.categoryId),
        }}
      />
    </div>
  );
}
