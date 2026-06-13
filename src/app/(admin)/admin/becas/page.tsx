import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { BecasTable } from "@/components/admin/becas-table";

const STATUS_FILTERS = [
  { value: undefined, label: "Todas" },
  { value: "ACTIVE", label: "Activas" },
  { value: "DRAFT", label: "Borradores" },
  { value: "PENDING_REVIEW", label: "En revisión" },
  { value: "CLOSED", label: "Cerradas" },
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function GestionarBecasPage({ searchParams }: PageProps) {
  const { status } = await searchParams;

  const validStatus = (
    ["ACTIVE", "DRAFT", "PENDING_REVIEW", "CLOSED"] as const
  ).includes(status as "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "CLOSED")
    ? (status as "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "CLOSED")
    : undefined;

  const scholarships = await db.scholarship.findMany({
    where: validStatus ? { status: validStatus } : {},
    orderBy: [{ updatedAt: "desc" }],
    include: {
      source: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Gestionar becas
          </h1>
          <p className="text-muted-foreground text-sm">
            {scholarships.length} beca{scholarships.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/becas/nueva">Agregar beca</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const href = filter.value
            ? `/admin/becas?status=${filter.value}`
            : "/admin/becas";
          const isActive = (filter.value ?? undefined) === validStatus;
          return (
            <Link
              key={filter.label}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <BecasTable
        scholarships={scholarships.map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          deadline: s.deadline ? s.deadline.toISOString() : null,
          applyUrl: s.applyUrl,
          countryDestination: s.countryDestination,
          source: s.source.name,
        }))}
      />
    </div>
  );
}
