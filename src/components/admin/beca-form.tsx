"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CoverageType, AcademicLevel } from "@/generated/prisma/enums";
import { coverageLabels, academicLevelLabels } from "@/lib/becas/format";

interface SourceOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  axis: "TYPE" | "AREA";
}

export interface BecaFormValues {
  title: string;
  description: string;
  coverageType: string;
  academicLevel: string;
  language: string;
  amountMin: string;
  amountMax: string;
  currency: string;
  countryOrigin: string;
  countryDestination: string;
  deadline: string;
  applyUrl: string;
  sourceId: string;
  categoryIds: string[];
}

interface BecaFormProps {
  sources: SourceOption[];
  categories: CategoryOption[];
  defaultSourceId: string;
  becaId?: string;
  initial?: Partial<BecaFormValues>;
}

const EMPTY_VALUES: BecaFormValues = {
  title: "",
  description: "",
  coverageType: "MONETARY",
  academicLevel: "UNDERGRAD",
  language: "es",
  amountMin: "",
  amountMax: "",
  currency: "MXN",
  countryOrigin: "",
  countryDestination: "México",
  deadline: "",
  applyUrl: "",
  sourceId: "",
  categoryIds: [],
};

type LinkCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; finalUrl?: string }
  | { state: "invalid"; reason?: string };

export function BecaForm({
  sources,
  categories,
  defaultSourceId,
  becaId,
  initial,
}: BecaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(becaId);

  const [values, setValues] = useState<BecaFormValues>({
    ...EMPTY_VALUES,
    sourceId: defaultSourceId,
    ...initial,
  });

  const [linkCheck, setLinkCheck] = useState<LinkCheck>({ state: "idle" });
  const [saving, setSaving] = useState<"DRAFT" | "ACTIVE" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof BecaFormValues>(
    key: K,
    value: BecaFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "applyUrl") {
      setLinkCheck({ state: "idle" });
    }
  }

  function toggleCategory(id: string) {
    setValues((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  async function handleVerifyLink() {
    if (!values.applyUrl.trim()) return;
    setLinkCheck({ state: "checking" });
    try {
      const res = await fetch("/api/admin/becas/validar-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: values.applyUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLinkCheck({ state: "invalid", reason: json.error ?? "Error" });
        return;
      }
      if (json.valid) {
        setLinkCheck({ state: "valid", finalUrl: json.finalUrl });
      } else {
        setLinkCheck({ state: "invalid", reason: json.reason });
      }
    } catch {
      setLinkCheck({
        state: "invalid",
        reason: "No se pudo verificar el link",
      });
    }
  }

  function buildPayload(status: "DRAFT" | "ACTIVE") {
    return {
      title: values.title,
      description: values.description,
      status,
      coverageType: values.coverageType,
      amountMin: values.amountMin ? Number(values.amountMin) : null,
      amountMax: values.amountMax ? Number(values.amountMax) : null,
      currency: values.currency,
      countryOrigin: values.countryOrigin || null,
      countryDestination: values.countryDestination,
      academicLevel: values.academicLevel,
      language: values.language || null,
      deadline: values.deadline || null,
      applyUrl: values.applyUrl,
      sourceId: values.sourceId,
      categoryIds: values.categoryIds,
    };
  }

  async function handleSave(status: "DRAFT" | "ACTIVE") {
    setFormError(null);

    if (status === "ACTIVE") {
      if (linkCheck.state !== "valid") {
        setFormError(
          'Debes verificar el link de la convocatoria (botón "Verificar link") antes de publicar.',
        );
        return;
      }
      if (!values.deadline) {
        setFormError(
          "La fecha límite es obligatoria para publicar como activa.",
        );
        return;
      }
      const deadlineDate = new Date(values.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate.getTime() < today.getTime()) {
        setFormError(
          "La fecha límite ya pasó; no se puede publicar como activa.",
        );
        return;
      }
      if (!/m[eé]xic/i.test(values.countryDestination)) {
        setFormError("Solo se pueden publicar becas para México.");
        return;
      }
    }

    setSaving(status);
    try {
      const url = isEdit ? `/api/admin/becas/${becaId}` : "/api/admin/becas";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(status)),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "No se pudo guardar la beca");
        return;
      }
      router.push("/admin/becas");
      router.refresh();
    } catch {
      setFormError("No se pudo guardar la beca");
    } finally {
      setSaving(null);
    }
  }

  const typeCategories = categories.filter((c) => c.axis === "TYPE");
  const areaCategories = categories.filter((c) => c.axis === "AREA");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1. Datos de la beca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de cobertura</Label>
              <Select
                value={values.coverageType}
                onValueChange={(v) => update("coverageType", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CoverageType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {coverageLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nivel académico</Label>
              <Select
                value={values.academicLevel}
                onValueChange={(v) => update("academicLevel", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AcademicLevel).map((value) => (
                    <SelectItem key={value} value={value}>
                      {academicLevelLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="amountMin">Monto mínimo</Label>
              <Input
                id="amountMin"
                type="number"
                min="0"
                value={values.amountMin}
                onChange={(e) => update("amountMin", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amountMax">Monto máximo</Label>
              <Input
                id="amountMax"
                type="number"
                min="0"
                value={values.amountMax}
                onChange={(e) => update("amountMax", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={values.currency}
                onChange={(e) => update("currency", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="countryOrigin">País de origen</Label>
              <Input
                id="countryOrigin"
                value={values.countryOrigin}
                onChange={(e) => update("countryOrigin", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="countryDestination">País destino</Label>
              <Input
                id="countryDestination"
                value={values.countryDestination}
                onChange={(e) => update("countryDestination", e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Solo becas para &quot;México&quot; pueden publicarse como
                activas.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Idioma</Label>
              <Input
                id="language"
                placeholder="es"
                value={values.language}
                onChange={(e) => update("language", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Fecha límite</Label>
              <Input
                id="deadline"
                type="date"
                value={values.deadline}
                onChange={(e) => update("deadline", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fuente</Label>
              <Select
                value={values.sourceId}
                onValueChange={(v) => update("sourceId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una fuente" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(typeCategories.length > 0 || areaCategories.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {typeCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Categorías (tipo)</Label>
                  <div className="flex flex-wrap gap-2">
                    {typeCategories.map((cat) => (
                      <CategoryToggle
                        key={cat.id}
                        category={cat}
                        checked={values.categoryIds.includes(cat.id)}
                        onToggle={() => toggleCategory(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {areaCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Categorías (área)</Label>
                  <div className="flex flex-wrap gap-2">
                    {areaCategories.map((cat) => (
                      <CategoryToggle
                        key={cat.id}
                        category={cat}
                        checked={values.categoryIds.includes(cat.id)}
                        onToggle={() => toggleCategory(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Link oficial de la convocatoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="applyUrl">URL de aplicación</Label>
            <Input
              id="applyUrl"
              type="url"
              placeholder="https://..."
              value={values.applyUrl}
              onChange={(e) => update("applyUrl", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleVerifyLink}
              disabled={
                linkCheck.state === "checking" || !values.applyUrl.trim()
              }
            >
              {linkCheck.state === "checking"
                ? "Verificando..."
                : "Verificar link"}
            </Button>
            {linkCheck.state === "valid" && (
              <span className="text-sm text-green-600 dark:text-green-400">
                ✅ Link válido
                {linkCheck.finalUrl ? ` (${linkCheck.finalUrl})` : ""}
              </span>
            )}
            {linkCheck.state === "invalid" && (
              <span className="text-destructive text-sm">
                ❌ {linkCheck.reason ?? "Link inválido"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {formError && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {formError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving !== null}
          onClick={() => handleSave("DRAFT")}
        >
          {saving === "DRAFT" ? "Guardando..." : "Guardar como borrador"}
        </Button>
        <Button
          type="button"
          disabled={saving !== null}
          onClick={() => handleSave("ACTIVE")}
        >
          {saving === "ACTIVE" ? "Publicando..." : "Publicar"}
        </Button>
      </div>
    </div>
  );
}

function CategoryToggle({
  category,
  checked,
  onToggle,
}: {
  category: CategoryOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {category.name}
    </button>
  );
}
