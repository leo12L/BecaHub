"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";

interface DiscoverResult {
  found: number;
  saved: number;
}

export function DiscoverButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<DiscoverResult | null>(null);

  async function discover() {
    if (state === "loading") return;
    setState("loading");
    setResult(null);

    try {
      const res = await fetch("/api/becas/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "default" }),
      });
      const json = (await res.json()) as DiscoverResult;
      setResult(json);
      setState("done");

      if (json.saved > 0) {
        setTimeout(() => router.refresh(), 500);
      }

      setTimeout(() => setState("idle"), 6000);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={discover}
      disabled={state === "loading"}
      className="border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:text-primary inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
      title="Buscar nuevas convocatorias con Tavily"
    >
      {state === "loading" ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Buscando…
        </>
      ) : state === "done" && result ? (
        <>
          <CheckCircle2 size={15} className="text-emerald-600" />
          {result.saved > 0
            ? `+${result.saved} nuevas`
            : "Sin novedades"}
        </>
      ) : (
        <>
          <Zap size={15} />
          Buscar más
        </>
      )}
    </button>
  );
}
