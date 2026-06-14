import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from "lucide-react";

interface Props {
  id: string;
  slug: string;
  title: string;
  institution: string;
  tags: string[];
  startLabel: string;
  deadlineLabel: string;
  applyUrl: string;
  country: string;
  description?: string;
  amount?: string | null;
  verified?: boolean;
}

export function RecommendedScholarshipCard({
  slug,
  title,
  institution,
  tags,
  startLabel,
  deadlineLabel,
  applyUrl,
  country,
  description,
  amount,
  verified = false,
}: Props) {
  return (
    <article className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="border-border flex items-start justify-between gap-4 border-b bg-[#F9FCFA] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm leading-snug font-bold">
            <Link
              href={`/becas/${slug}`}
              className="hover:text-primary focus-visible:underline focus-visible:outline-none"
            >
              {title}
            </Link>
          </h3>
          <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <Building2 size={11} className="text-highlight shrink-0" />
            <span className="truncate">{institution}</span>
          </div>
        </div>
        {verified && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#DFF5EA] px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-[#146C43]">
            <ShieldCheck size={12} />
            Verificada
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {description && (
          <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-relaxed">
            {description}
          </p>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-border bg-secondary text-secondary-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-highlight" />
            <span className="text-foreground font-semibold">{country}</span>
          </span>
          {amount && (
            <span className="text-foreground font-bold">{amount}</span>
          )}
        </div>
      </div>

      <div className="border-border bg-secondary/55 flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <DateLabel label="Inicio" value={startLabel} tone="highlight" />
          <DateLabel label="Cierre" value={deadlineLabel} tone="primary" />
        </div>
        <div className="flex gap-2">
          <Link
            href={`/becas/${slug}`}
            className="border-border text-foreground hover:border-primary/40 hover:text-primary inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition-colors"
          >
            Ver detalle
          </Link>
          <a
            href={applyUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors"
          >
            Postular
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}

function DateLabel({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "highlight";
}) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold uppercase">
        <CalendarDays
          className={
            tone === "primary" ? "text-primary size-3" : "text-highlight size-3"
          }
          aria-hidden
        />
        {label}
      </p>
      <p
        className={
          tone === "primary"
            ? "text-primary mt-0.5 font-bold"
            : "text-foreground mt-0.5 font-bold"
        }
      >
        {value}
      </p>
    </div>
  );
}
