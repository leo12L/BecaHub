import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bot, SearchX } from "lucide-react";
import { SearchBar } from "@/components/scholarships/search-bar";
import { FilterPanel } from "@/components/scholarships/filter-panel";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Pagination } from "@/components/scholarships/pagination";
import { DiscoverButton } from "@/components/scholarships/discover-button";
import {
  getBecas,
  getFilterCategories,
  getFilterCountries,
  type SortOrder,
} from "@/lib/becas/queries";
import { becasQuerySchema } from "@/validators/becas.validator";

export const metadata: Metadata = {
  title: "Explorar becas",
  description:
    "Filtra becas por tipo, área, país, nivel académico y fecha límite.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toRecord(sp: Record<string, string | string[] | undefined>) {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") record[key] = value;
    else if (Array.isArray(value) && value[0]) record[key] = value[0];
  }
  return record;
}

export default async function BecasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = toRecord(await searchParams);
  const parsed = becasQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : becasQuerySchema.parse({});
  const sort: SortOrder = raw.sort === "recent" ? "recent" : "deadline";

  const [{ data, pagination }, categories, countries] = await Promise.all([
    getBecas(query, { sort }),
    getFilterCategories(),
    getFilterCountries(),
  ]);

  const resultLabel =
    pagination.total === 1 ? "convocatoria encontrada" : "convocatorias";

  return (
    <div className="bg-background min-h-screen">
      <div className="border-border bg-card border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase">
              Catálogo completo
            </p>
            <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight">
              Explorar becas
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Mostrando todas las convocatorias disponibles en la API, sin
              ocultar cerradas, borradores o registros pendientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DiscoverButton />
            <Link
              href="/perfil/asistente"
              className="border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:text-primary inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Bot className="size-4" aria-hidden />
              Asistente IA
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="border-border bg-card mb-6 rounded-2xl border p-4 shadow-sm">
          <Suspense
            fallback={
              <div className="bg-secondary h-11 animate-pulse rounded-xl" />
            }
          >
            <SearchBar />
          </Suspense>
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            {pagination.total === 0
              ? "Sin resultados para estos filtros."
              : `${pagination.total.toLocaleString("es-MX")} ${resultLabel}`}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 lg:w-64">
            <Suspense
              fallback={
                <div className="border-border bg-card h-20 animate-pulse rounded-2xl border" />
              }
            >
              <FilterPanel
                typeOptions={categories.type}
                areaOptions={categories.area}
                countryOptions={countries}
              />
            </Suspense>
          </aside>

          <section className="min-w-0 flex-1">
            {data.length === 0 ? (
              <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border px-6 py-20 text-center shadow-sm">
                <span className="bg-secondary text-highlight flex size-12 items-center justify-center rounded-full">
                  <SearchX className="size-6" aria-hidden />
                </span>
                <h2 className="text-foreground text-base font-bold">
                  Sin resultados
                </h2>
                <p className="text-muted-foreground max-w-xs text-sm">
                  Intenta con otros filtros o usa palabras distintas.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.map((scholarship) => (
                    <ScholarshipCard
                      key={scholarship.id}
                      scholarship={scholarship}
                    />
                  ))}
                </div>
                <div className="mt-10">
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    searchParams={raw}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
