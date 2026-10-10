"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, GraduationCap, Globe, Languages } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { BecaListItem } from "@/lib/becas/queries";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { cn } from "@/lib/utils";

interface CategoryCarouselProps {
  scholarships: BecaListItem[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  filter: (scholarship: BecaListItem) => boolean;
}

const CATEGORIES: Category[] = [
  {
    id: "closing-soon",
    name: "Cierran pronto",
    description: "Últimos días para aplicar",
    icon: Clock,
    filter: (s) => {
      if (!s.deadline) return false;
      const deadline = new Date(s.deadline);
      const now = new Date();
      const daysUntil = Math.floor(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntil >= 0 && daysUntil <= 30;
    },
  },
  {
    id: "postgrad-abroad",
    name: "Posgrado en el extranjero",
    description: "Maestrías y doctorados",
    icon: GraduationCap,
    filter: (s) =>
      (s.academicLevel === "GRAD" || s.academicLevel === "PHD") &&
      !s.destinationCountries.includes("MX"),
  },
  {
    id: "undergrad-mexico",
    name: "Licenciatura en México",
    description: "Estudios de pregrado",
    icon: GraduationCap,
    filter: (s) =>
      s.academicLevel === "UNDERGRAD" && s.destinationCountries.includes("MX"),
  },
  {
    id: "languages",
    name: "Idiomas e intercambio",
    description: "Programas de idiomas y cultura",
    icon: Languages,
    filter: (s) => s.language && s.language.toLowerCase() !== "español",
  },
];

export function CategoryCarousel({ scholarships }: CategoryCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORIES[0]?.id || "",
  );

  const activeData = CATEGORIES.find((c) => c.id === activeCategory);
  const filteredScholarships = activeData
    ? scholarships.filter(activeData.filter)
    : [];

  return (
    <section className="bg-secondary/30 py-16 px-4">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground lg:text-4xl">
            Explora por categoría
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Encuentra la beca perfecta según tus necesidades académicas
          </p>
        </div>

        {/* Category selector carousel */}
        <div className="relative mx-auto mb-8 max-w-4xl px-12">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <CarouselItem
                    key={category.id}
                    className="basis-full pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4"
                  >
                    <button
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "h-full w-full rounded-2xl border p-6 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50",
                      )}
                      aria-pressed={isActive}
                    >
                      <div
                        className={cn(
                          "mb-3 flex size-12 items-center justify-center rounded-xl",
                          isActive ? "bg-primary/20" : "bg-secondary",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-6",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <h3
                        className={cn(
                          "mb-1 text-lg font-bold",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </Carousel>
        </div>

        {/* Scholarships display */}
        <div className="mx-auto max-w-4xl">
          {filteredScholarships.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
              <div>
                <p className="text-muted-foreground text-lg">
                  No hay becas disponibles en esta categoría
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-foreground text-xl font-bold">
                  {activeData?.name}
                  <span className="text-muted-foreground ml-2 text-base font-normal">
                    ({filteredScholarships.length})
                  </span>
                </h3>
                <Link
                  href={`/becas?category=${activeCategory}`}
                  className="text-primary hover:text-primary/80 text-sm font-semibold"
                >
                  Ver todas →
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredScholarships.slice(0, 4).map((scholarship) => (
                  <ScholarshipCard
                    key={scholarship.id}
                    scholarship={scholarship}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
