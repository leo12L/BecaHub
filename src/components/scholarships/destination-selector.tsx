"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DESTINATION_OPTIONS } from "@/lib/geo";

export function DestinationSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("destination");

  function selectDestination(id: string) {
    const params = new URLSearchParams(searchParams);
    if (selected === id) {
      params.delete("destination");
    } else {
      params.set("destination", id);
    }
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="mb-6">
      <p className="text-foreground mb-3 text-sm font-semibold">
        Filtrar por destino
      </p>
      <div className="flex flex-wrap gap-2">
        {DESTINATION_OPTIONS.map((destination) => (
          <button
            key={destination.id}
            type="button"
            onClick={() => selectDestination(destination.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all",
              selected === destination.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-card-foreground border-border hover:border-primary hover:bg-secondary border",
            )}
            aria-pressed={selected === destination.id}
          >
            {destination.name}
          </button>
        ))}
      </div>
    </div>
  );
}
