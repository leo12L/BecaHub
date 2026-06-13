"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSearchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    const query = params.toString();
    router.push(query ? `/becas?${query}` : "/becas");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej. maestría en ciencias, beca de viaje, Chevening…"
          aria-label="Buscar becas"
          className="h-12 rounded-xl pl-11 text-base"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 rounded-xl px-6 text-base"
      >
        Buscar becas
      </Button>
    </form>
  );
}
