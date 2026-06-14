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
} from "@/lib/becas/format";

function ScholarshipCard({ scholarship }: { scholarship: BecaListItem }) {
  const coverage =
    formatAmount(
      scholarship.amountMin,
      scholarship.amountMax,
      scholarship.currency,
    ) ?? coverageLabels[scholarship.coverageType];

  const deadlineLabel = scholarship.deadline
    ? new Date(scholarship.deadline).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      })
    : "Sin fecha límite";

  return (
    <Link
      href={`/becas/${scholarship.slug}`}
      className="w-full flex-shrink-0 rounded-lg border border-[#E8E8E8] bg-white p-4 transition-colors hover:border-[#800020]/30"
    >
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">
          {scholarship.title}
        </p>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          {scholarship.source.name}
        </p>
      </div>

      {/* Badges */}
      <div className="mt-3 flex gap-2">
        <span className="rounded-md bg-[#004451]/10 px-2 py-0.5 text-xs text-[#004451]">
          {coverage}
        </span>
        <span className="rounded-md bg-[#F0F0F0] px-2 py-0.5 text-xs text-[#6B7280]">
          {academicLevelLabels[scholarship.academicLevel]}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-[#800020]/10 px-2.5 py-0.5 text-xs font-medium text-[#800020]">
          {scholarship.countryDestination}
        </span>
        <span className="text-xs text-[#6B7280]">Cierra: {deadlineLabel}</span>
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

  // Duplicate array for infinite loop
  const duplicatedScholarships = [...scholarships, ...scholarships];

  return (
    <div
      className="scholarship-carousel-container hidden lg:block"
      style={{
        overflow: "hidden",
        height: "480px",
        position: "relative",
      }}
    >
      {/* Mask gradient */}
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
