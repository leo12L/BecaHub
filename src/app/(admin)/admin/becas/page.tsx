import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { BecasTable } from "@/components/admin/becas-table";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

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

  // Verificar si hubo una corrida exitosa en las últimas 48 horas
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const recentSuccessfulRun = await db.scraperLog.findFirst({
    where: {
      status: "SUCCESS",
      finishedAt: { gte: fortyEightHoursAgo },
    },
    orderBy: { finishedAt: "desc" },
  });

  const showIngestaWarning = !recentSuccessfulRun;

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

      {showIngestaWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-950">
          <AlertTriangle className="size-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div>
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              Sin ingesta automática reciente
            </p>
            <p className="mt-1 text-yellow-800 dark:text-yellow-200">
              No se ha detectado ninguna corrida exitosa de ingesta en las
              últimas 48 horas. Verifica que el job de GitHub Actions esté
              configurado correctamente.
            </p>
          </div>
        </div>
      )}

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
          destinationCountries: s.destinationCountries,
          source: s.source.name,
        }))}
      />
    </div>
  );
}
