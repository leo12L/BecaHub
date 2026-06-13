"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { academicLevelLabels } from "@/lib/becas/format";

export type FilterOption = { slug: string; name: string };

const ACADEMIC_LEVELS = Object.entries(academicLevelLabels) as Array<
  [keyof typeof academicLevelLabels, string]
>;

const SORT_OPTIONS = [
  { value: "deadline", label: "Fecha límite próxima" },
  { value: "recent", label: "Más recientes" },
];

const ALL_VALUE = "__all__";

export function FilterPanel({
  typeOptions,
  areaOptions,
  countryOptions,
}: {
  typeOptions: FilterOption[];
  areaOptions: FilterOption[];
  countryOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === ALL_VALUE) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filterKeys = [
    "type",
    "area",
    "country",
    "level",
    "sort",
    "deadlineBefore",
  ];
  const hasActiveFilters = filterKeys.some((key) => searchParams.has(key));

  function clearFilters() {
    const params = new URLSearchParams(searchParams);
    for (const key of [...filterKeys, "page"]) {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Select
        value={searchParams.get("type") ?? ALL_VALUE}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="w-full" aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo de beca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
          {typeOptions.map((option) => (
            <SelectItem key={option.slug} value={option.slug}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("area") ?? ALL_VALUE}
        onValueChange={(v) => setParam("area", v)}
      >
        <SelectTrigger className="w-full" aria-label="Filtrar por área">
          <SelectValue placeholder="Área de estudio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todas las áreas</SelectItem>
          {areaOptions.map((option) => (
            <SelectItem key={option.slug} value={option.slug}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("country") ?? ALL_VALUE}
        onValueChange={(v) => setParam("country", v)}
      >
        <SelectTrigger className="w-full" aria-label="Filtrar por país">
          <SelectValue placeholder="País destino" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los países</SelectItem>
          {countryOptions.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("level") ?? ALL_VALUE}
        onValueChange={(v) => setParam("level", v)}
      >
        <SelectTrigger
          className="w-full"
          aria-label="Filtrar por nivel académico"
        >
          <SelectValue placeholder="Nivel académico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los niveles</SelectItem>
          {ACADEMIC_LEVELS.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={searchParams.get("deadlineBefore") ?? ""}
        onChange={(e) => setParam("deadlineBefore", e.target.value)}
        aria-label="Fecha límite antes de"
        className="w-full"
      />

      <div className="flex gap-2">
        <Select
          value={searchParams.get("sort") ?? "deadline"}
          onValueChange={(v) => setParam("sort", v)}
        >
          <SelectTrigger className="w-full" aria-label="Ordenar resultados">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            aria-label="Limpiar filtros"
            title="Limpiar filtros"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
