import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { SearchBar } from "@/components/scholarships/search-bar";
import { FilterPanel } from "@/components/scholarships/filter-panel";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Pagination } from "@/components/scholarships/pagination";
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
    "Filtra becas activas por tipo, área de estudio, país, nivel académico y fecha límite.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toQueryRecord(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
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
  const rawParams = toQueryRecord(await searchParams);
  const parsed = becasQuerySchema.safeParse(rawParams);
  const query = parsed.success ? parsed.data : becasQuerySchema.parse({});

  const sort: SortOrder = rawParams.sort === "recent" ? "recent" : "deadline";

  const [{ data, pagination }, categories, countries] = await Promise.all([
    getBecas(query, { sort }),
    getFilterCategories(),
    getFilterCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          Explorar becas
        </h1>
        <p className="text-muted-foreground">
          {pagination.total === 0
            ? "No encontramos becas con estos filtros."
            : `${pagination.total} ${pagination.total === 1 ? "beca encontrada" : "becas encontradas"}.`}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <SearchBar />
        <FilterPanel
          typeOptions={categories.type}
          areaOptions={categories.area}
          countryOptions={countries}
        />
      </div>

      {data.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
            <SearchX className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-foreground text-lg font-semibold">
            No se encontraron becas
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Intenta ajustar los filtros o usar otras palabras clave en la
            búsqueda.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>

          <div className="mt-10">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              searchParams={rawParams}
            />
          </div>
        </>
      )}
    </div>
  );
}
