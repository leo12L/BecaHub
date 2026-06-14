/**
 * Scholarship Vertical Carousel Component
 * Infinite vertical scrolling carousel with CSS animations.
 * No external libraries, pure CSS.
 */

import Link from "next/link";
import "./scholarship-vertical-carousel.css";
import type { BecaListItem } from "@/lib/becas/queries";
import {
  academicLevelLabels,
  coverageLabels,
  formatAmount,
  statusLabels,
} from "@/lib/becas/format";

function fmtShortDate(date: Date | string | null | undefined) {
  if (!date) return "Sin fecha";
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function ScholarshipCard({ scholarship }: { scholarship: BecaListItem }) {
  const coverage =
    formatAmount(
      scholarship.amountMin,
      scholarship.amountMax,
      scholarship.currency,
    ) ?? coverageLabels[scholarship.coverageType];

  return (
    <Link
      href={`/becas/${scholarship.slug}`}
      className="border-border hover:border-primary/40 w-full flex-shrink-0 rounded-xl border bg-white p-4 shadow-sm transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground line-clamp-2 text-sm font-bold">
            {scholarship.title}
          </p>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {scholarship.source.name}
          </p>
        </div>
        <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
          {statusLabels[scholarship.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="bg-highlight/10 text-highlight rounded-md px-2 py-0.5 text-xs font-semibold">
          {coverage}
        </span>
        <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs font-semibold">
          {academicLevelLabels[scholarship.academicLevel]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-[#F5FAF7] px-2.5 py-2">
          <p className="text-muted-foreground font-bold uppercase">Inicio</p>
          <p className="text-foreground mt-0.5 font-semibold">
            {fmtShortDate(scholarship.createdAt)}
          </p>
        </div>
        <div className="rounded-lg bg-[#FFF4F2] px-2.5 py-2">
          <p className="text-primary font-bold uppercase">Cierre</p>
          <p className="text-primary mt-0.5 font-semibold">
            {fmtShortDate(scholarship.deadline)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ScholarshipVerticalCarousel({
  scholarships,
}: {
  scholarships: BecaListItem[];
}) {
  if (scholarships.length === 0) return null;

  const duplicatedScholarships = [...scholarships, ...scholarships];

  return (
    <div
      className="scholarship-carousel-container hidden lg:block"
      style={{
        overflow: "hidden",
        height: "520px",
        position: "relative",
      }}
    >
      <div
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          height: "100%",
          position: "relative",
        }}
      >
        <div className="scholarship-carousel-inner">
          {duplicatedScholarships.map((scholarship, index) => (
            <ScholarshipCard
              key={`${scholarship.id}-${index}`}
              scholarship={scholarship}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
