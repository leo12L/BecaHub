"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { REGIONS, countryCodeToName } from "@/lib/geo";
import type { BecaListItem } from "@/lib/becas/queries";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";

const InteractiveGlobe = dynamic(
  () =>
    import("./interactive-globe").then((mod) => ({
      default: mod.InteractiveGlobe,
    })),
  { ssr: false },
);

const GLOBE_LOCATIONS = {
  MX: [23.6345, -102.5528] as [number, number],
  ES: [40.4168, -3.7038] as [number, number],
  US: [37.0902, -95.7129] as [number, number],
  CA: [56.1304, -106.3468] as [number, number],
  GB: [55.3781, -3.436] as [number, number],
  DE: [51.1657, 10.4515] as [number, number],
  FR: [46.2276, 2.2137] as [number, number],
  CN: [35.8617, 104.1954] as [number, number],
  JP: [36.2048, 138.2529] as [number, number],
};

interface Destination {
  id: string;
  name: string;
  type: "country" | "region";
  codes: string[];
  globeLocation?: [number, number];
}

const DESTINATIONS: Destination[] = [
  { id: "MX", name: "México", type: "country", codes: ["MX"], globeLocation: GLOBE_LOCATIONS.MX },
  { id: "US", name: "Estados Unidos", type: "country", codes: ["US"], globeLocation: GLOBE_LOCATIONS.US },
  { id: "CA", name: "Canadá", type: "country", codes: ["CA"], globeLocation: GLOBE_LOCATIONS.CA },
  { id: "ES", name: "España", type: "country", codes: ["ES"], globeLocation: GLOBE_LOCATIONS.ES },
  { id: "europa", name: "Europa", type: "region", codes: REGIONS.europa, globeLocation: GLOBE_LOCATIONS.FR },
  { id: "GB", name: "Reino Unido", type: "country", codes: ["GB"], globeLocation: GLOBE_LOCATIONS.GB },
  { id: "DE", name: "Alemania", type: "country", codes: ["DE"], globeLocation: GLOBE_LOCATIONS.DE },
  { id: "CN", name: "China", type: "country", codes: ["CN"], globeLocation: GLOBE_LOCATIONS.CN },
  { id: "JP", name: "Japón", type: "country", codes: ["JP"], globeLocation: GLOBE_LOCATIONS.JP },
  { id: "latinoamerica", name: "Latinoamérica", type: "region", codes: REGIONS.latinoamérica, globeLocation: GLOBE_LOCATIONS.MX },
];

interface DestinationSelectorProps {
  scholarships: BecaListItem[];
}

export function DestinationSelector({ scholarships }: DestinationSelectorProps) {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  const filteredScholarships = useMemo(() => {
    if (!selectedDestination) return [];

    return scholarships.filter((scholarship) => {
      return selectedDestination.codes.some((code) =>
        scholarship.destinationCountries.includes(code),
      );
    });
  }, [scholarships, selectedDestination]);

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
  };

  const globeMarkers = useMemo(() => {
    if (!selectedDestination || !selectedDestination.globeLocation) return [];

    return [
      {
        location: selectedDestination.globeLocation,
        size: 0.1,
      },
    ];
  }, [selectedDestination]);


  return (
    <section className="bg-background py-16 px-4">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground lg:text-4xl">
            ¿A dónde quieres ir?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Explora becas por destino. Selecciona un país o región para ver las
            oportunidades disponibles.
          </p>
        </div>

        {/* Destination chips */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {DESTINATIONS.map((destination) => (
            <button
              key={destination.id}
              onClick={() => handleDestinationClick(destination)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                selectedDestination?.id === destination.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-card-foreground border border-border hover:border-primary hover:bg-secondary",
              )}
              aria-pressed={selectedDestination?.id === destination.id}
            >
              {destination.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Globe */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <InteractiveGlobe
                markers={globeMarkers}
                focusLocation={selectedDestination?.globeLocation}
              />
            </div>
          </div>

          {/* Scholarships list */}
          <div className="flex flex-col">
            {!selectedDestination ? (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
                <div>
                  <div className="text-muted-foreground mb-2 text-4xl">🌍</div>
                  <p className="text-muted-foreground text-lg">
                    Selecciona un destino para ver becas disponibles
                  </p>
                </div>
              </div>
            ) : filteredScholarships.length === 0 ? (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
                <div>
                  <div className="text-muted-foreground mb-2 text-4xl">😔</div>
                  <p className="text-foreground mb-1 text-lg font-semibold">
                    No hay becas disponibles para {selectedDestination.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Intenta seleccionar otro destino o revisa más tarde
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="mb-4 text-xl font-bold text-foreground">
                  Becas para {selectedDestination.name}
                  <span className="text-muted-foreground ml-2 text-base font-normal">
                    ({filteredScholarships.length})
                  </span>
                </h3>
                <div className="grid gap-4">
                  {filteredScholarships.slice(0, 4).map((scholarship) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
                  ))}
                  {filteredScholarships.length > 4 && (
                    <a
                      href={`/becas?destination=${selectedDestination.id}`}
                      className="text-primary hover:text-primary/80 text-center text-sm font-semibold"
                    >
                      Ver todas las {filteredScholarships.length} becas →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
