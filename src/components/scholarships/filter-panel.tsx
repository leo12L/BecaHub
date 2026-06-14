"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { academicLevelLabels } from "@/lib/becas/format";

export type FilterOption = { slug: string; name: string };

const ACADEMIC_LEVELS = Object.entries(academicLevelLabels) as Array<
  [keyof typeof academicLevelLabels, string]
>;

const SORT_OPTIONS = [
  { value: "deadline", label: "Fecha de cierre" },
  { value: "recent", label: "Más recientes" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activas" },
  { value: "CLOSED", label: "Cerradas" },
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING_REVIEW", label: "En revisión" },
];

const ALL = "__all__";
const FILTER_KEYS = [
  "type",
  "area",
  "country",
  "level",
  "status",
  "sort",
  "deadlineBefore",
] as const;

const selectClass = "w-full border-[#CFE2DB] bg-white text-[#10231F]";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold tracking-widest text-[#4A665E] uppercase">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-[#D5E6DF]" />;
}

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
  const [open, setOpen] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function valueFor(key: string, fallback = ALL) {
    return searchParams.get(key) ?? fallback;
  }

  const activeCount = FILTER_KEYS.filter((key) => searchParams.has(key)).length;
  const hasFilters = activeCount > 0;

  function clear() {
    const params = new URLSearchParams(searchParams);
    for (const key of [...FILTER_KEYS, "page"]) params.delete(key);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const body = (
    <div className="space-y-4">
      <div>
        <Label>Ordenar por</Label>
        <Select
          value={valueFor("sort", "deadline")}
          onValueChange={(value) => updateParam("sort", value)}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Divider />

      <div>
        <Label>Estado</Label>
        <Select
          value={valueFor("status")}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tipo de beca</Label>
        <Select
          value={valueFor("type")}
          onValueChange={(value) => updateParam("type", value)}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {typeOptions.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Área de estudio</Label>
        <Select
          value={valueFor("area")}
          onValueChange={(value) => updateParam("area", value)}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue placeholder="Todas las áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las áreas</SelectItem>
            {areaOptions.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Nivel académico</Label>
        <Select
          value={valueFor("level")}
          onValueChange={(value) => updateParam("level", value)}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue placeholder="Todos los niveles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los niveles</SelectItem>
            {ACADEMIC_LEVELS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {countryOptions.length > 0 && (
        <div>
          <Label>País destino</Label>
          <Select
            value={valueFor("country")}
            onValueChange={(value) => updateParam("country", value)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue placeholder="Todos los países" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los países</SelectItem>
              {countryOptions.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Cierra antes del</Label>
        <input
          id="deadline-filter"
          type="date"
          value={searchParams.get("deadlineBefore") ?? ""}
          onChange={(event) =>
            updateParam("deadlineBefore", event.target.value)
          }
          className="focus:border-primary focus:ring-primary w-full rounded-lg border border-[#CFE2DB] bg-white px-3 py-2 text-sm text-[#10231F] focus:ring-1 focus:outline-none"
        />
      </div>

      {hasFilters && (
        <>
          <Divider />
          <Button
            type="button"
            variant="ghost"
            onClick={clear}
            className="text-primary hover:text-primary w-full justify-center hover:bg-[#FBE7E3]"
          >
            <X className="mr-1.5 size-3.5" />
            Limpiar filtros ({activeCount})
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-[#D5E6DF] bg-white px-4 py-3 text-sm font-semibold text-[#18352F] shadow-sm hover:bg-[#F5FAF7] lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-primary" />
          Filtros
          {hasFilters && (
            <span className="bg-primary rounded-full px-2 py-0.5 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-highlight" />
        ) : (
          <ChevronDown size={16} className="text-highlight" />
        )}
      </button>

      {open && (
        <div className="rounded-xl border border-[#D5E6DF] bg-white p-5 shadow-sm lg:hidden">
          {body}
        </div>
      )}

      <div className="hidden rounded-2xl border border-[#D5E6DF] bg-white p-5 shadow-sm lg:block">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#10231F]">
            <SlidersHorizontal size={15} className="text-primary" />
            Filtros
          </h2>
          {hasFilters && (
            <span className="bg-primary rounded-full px-2 py-0.5 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {body}
      </div>
    </>
  );
}
