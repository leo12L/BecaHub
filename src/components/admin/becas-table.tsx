"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { statusLabels, getDeadlineInfo } from "@/lib/becas/format";
import type { ScholarshipStatus } from "@/generated/prisma/enums";

export interface BecaRow {
  id: string;
  title: string;
  status: ScholarshipStatus;
  deadline: string | null;
  applyUrl: string;
  countryDestination: string;
  source: string;
}

interface BecasTableProps {
  scholarships: BecaRow[];
}

type LinkHealth =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid" }
  | { state: "invalid"; reason?: string; archived: boolean };

export function BecasTable({ scholarships }: BecasTableProps) {
  const router = useRouter();
  const [health, setHealth] = useState<Record<string, LinkHealth>>({});
  const [archiving, setArchiving] = useState<string | null>(null);

  async function handleReverify(id: string) {
    setHealth((prev) => ({ ...prev, [id]: { state: "checking" } }));
    try {
      const res = await fetch(`/api/admin/becas/${id}/reverify`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setHealth((prev) => ({
          ...prev,
          [id]: { state: "invalid", reason: json.error, archived: false },
        }));
        return;
      }
      const { health: result, archived } = json.data as {
        health: { valid: boolean; reason?: string };
        archived: boolean;
      };
      setHealth((prev) => ({
        ...prev,
        [id]: result.valid
          ? { state: "valid" }
          : { state: "invalid", reason: result.reason, archived },
      }));
      if (archived) {
        router.refresh();
      }
    } catch {
      setHealth((prev) => ({
        ...prev,
        [id]: { state: "invalid", reason: "Error de red", archived: false },
      }));
    }
  }

  async function handleArchive(id: string) {
    setArchiving(id);
    try {
      await fetch(`/api/admin/becas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      router.refresh();
    } finally {
      setArchiving(null);
    }
  }

  if (scholarships.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No hay becas en este filtro.
      </p>
    );
  }

  return (
    <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b text-left">
            <th className="p-2.5 font-medium">Título</th>
            <th className="p-2.5 font-medium">Estado</th>
            <th className="p-2.5 font-medium">Fecha límite</th>
            <th className="p-2.5 font-medium">Fuente</th>
            <th className="p-2.5 font-medium">Link</th>
            <th className="p-2.5 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {scholarships.map((s) => {
            const deadlineInfo = getDeadlineInfo(s.deadline, s.status);
            const h = health[s.id] ?? { state: "idle" };
            return (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-2.5">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {s.countryDestination}
                  </div>
                </td>
                <td className="p-2.5">{statusLabels[s.status]}</td>
                <td className="p-2.5">{deadlineInfo.label}</td>
                <td className="p-2.5">{s.source}</td>
                <td className="p-2.5">
                  {h.state === "idle" && (
                    <span className="text-muted-foreground">Sin verificar</span>
                  )}
                  {h.state === "checking" && <span>Verificando...</span>}
                  {h.state === "valid" && (
                    <span className="text-green-600 dark:text-green-400">
                      ✅ Vivo
                    </span>
                  )}
                  {h.state === "invalid" && (
                    <span className="text-destructive">
                      ❌ {h.reason ?? "Caído"}
                      {h.archived ? " (archivada)" : ""}
                    </span>
                  )}
                </td>
                <td className="p-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/becas/${s.id}/editar`}>Editar</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReverify(s.id)}
                      disabled={h.state === "checking"}
                    >
                      Re-verificar link
                    </Button>
                    {s.status !== "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(s.id)}
                        disabled={archiving === s.id}
                      >
                        {archiving === s.id ? "Archivando..." : "Archivar"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
