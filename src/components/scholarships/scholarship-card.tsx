import Link from "next/link";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import { CategoryBadge } from "@/components/scholarships/category-badge";
import { CoverageBadge } from "@/components/scholarships/coverage-badge";
import {
  academicLevelLabels,
  formatAmount,
  statusLabels,
} from "@/lib/becas/format";
import type { BecaListItem } from "@/lib/becas/queries";
import type { ScholarshipStatus } from "@/generated/prisma/enums";

const STATUS_PILL: Record<ScholarshipStatus, string> = {
  ACTIVE: "bg-[#DFF5EA] text-[#146C43]",
  CLOSED: "bg-[#FBE7E3] text-[#A23B20]",
  DRAFT: "bg-[#FFF3D1] text-[#825A00]",
  PENDING_REVIEW: "bg-[#E4F1FF] text-[#1F5C99]",
};

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ScholarshipCard({
  scholarship,
}: {
  scholarship: BecaListItem;
}) {
  const amount = formatAmount(
    scholarship.amountMin,
    scholarship.amountMax,
    scholarship.currency,
  );
  const closing = fmtDate(scholarship.deadline);
  const start = fmtDate(scholarship.createdAt);
  const liveDeadline =
    scholarship.status === "ACTIVE" &&
    scholarship.deadline &&
    new Date(scholarship.deadline) > new Date();

  return (
    <article className="group hover:border-primary/45 flex h-full flex-col overflow-hidden rounded-2xl border border-[#D5E6DF] bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-[#D5E6DF] bg-[#F9FCFA] px-5 py-4">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <CoverageBadge coverageType={scholarship.coverageType} />
          {scholarship.categories.slice(0, 1).map((cat) => (
            <CategoryBadge key={cat.id} category={cat} asLink={false} />
          ))}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_PILL[scholarship.status]}`}
        >
          {statusLabels[scholarship.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <h3 className="group-hover:text-primary text-base leading-snug font-bold text-[#10231F] transition-colors">
          <Link
            href={`/becas/${scholarship.slug}`}
            className="focus-visible:underline focus-visible:outline-none"
          >
            {scholarship.title}
          </Link>
        </h3>

        {scholarship.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4A665E]">
            {scholarship.description}
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-[#4A665E]">
            <MapPin className="text-highlight size-4 shrink-0" aria-hidden />
            <span className="truncate font-semibold text-[#18352F]">
              {scholarship.countryDestination}
            </span>
            <span className="text-[#8AA59B]">/</span>
            <span className="truncate">
              {academicLevelLabels[scholarship.academicLevel]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#4A665E]">
            <Building2 className="text-highlight size-4 shrink-0" aria-hidden />
            <span className="truncate">{scholarship.source.name}</span>
          </div>

          {amount && (
            <p className="pt-1 text-base font-extrabold text-[#10231F]">
              {amount}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-[#D5E6DF] border-t border-[#D5E6DF] bg-[#F5FAF7]">
        <DateCell label="Inicio" value={start ?? "Sin fecha"} />
        <DateCell
          label="Cierre"
          value={closing ?? "Sin fecha"}
          urgent={Boolean(liveDeadline)}
        />
      </div>
    </article>
  );
}

function DateCell({
  label,
  value,
  urgent = false,
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className={urgent ? "bg-[#FFF4F2] px-4 py-3" : "px-4 py-3"}>
      <div className="flex items-center gap-2">
        <CalendarDays
          className={
            urgent
              ? "text-primary size-4 shrink-0"
              : "text-highlight size-4 shrink-0"
          }
          aria-hidden
        />
        <div>
          <p className="text-[10px] font-bold text-[#4A665E] uppercase">
            {label}
          </p>
          <p
            className={
              urgent
                ? "text-primary text-xs font-bold"
                : "text-xs font-bold text-[#18352F]"
            }
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
