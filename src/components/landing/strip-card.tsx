import Link from "next/link";
import type { LandingStripCard } from "@/lib/becas/landing-cards";

function CardBody({
  card,
  exampleBadge,
}: {
  card: LandingStripCard;
  exampleBadge: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground line-clamp-2 text-sm font-bold">
          {card.title}
        </p>
        {exampleBadge ? (
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full border border-dashed border-current/30 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            Ejemplo
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 truncate text-xs">
        {card.sourceName}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="bg-highlight/10 text-highlight rounded-md px-2 py-0.5 text-[11px] font-semibold">
          {card.coverageLabel}
        </span>
        <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-[11px] font-semibold">
          {card.levelLabel}
        </span>
      </div>
      <div className="text-muted-foreground mt-3 flex items-center justify-between text-[11px] font-medium">
        <span className="truncate">{card.country}</span>
        <span className="text-primary shrink-0">{card.deadlineLabel}</span>
      </div>
    </>
  );
}

export function StripCard({
  card,
  copy,
}: {
  card: LandingStripCard;
  copy: "original" | "duplicate";
}) {
  const isDuplicate = copy === "duplicate";
  const isExample = card.kind === "example";
  const decorative = isDuplicate || isExample;

  const className = isExample
    ? "border-border/80 bg-card/80 w-[240px] rounded-xl border border-dashed p-3.5 shadow-sm opacity-80"
    : "border-border bg-card hover:border-primary/40 w-[240px] rounded-xl border p-3.5 shadow-sm transition-colors";

  if (isExample || isDuplicate || !card.href) {
    return (
      <article
        className={className}
        data-landing-card={card.kind}
        data-strip-copy={copy}
        data-card-id={card.id}
        aria-hidden={decorative ? true : undefined}
      >
        <CardBody card={card} exampleBadge={isExample} />
      </article>
    );
  }

  return (
    <article
      data-landing-card="real"
      data-strip-copy="original"
      data-card-id={card.id}
    >
      <Link
        href={card.href}
        className={`pointer-events-auto block ${className}`}
      >
        <CardBody card={card} exampleBadge={false} />
      </Link>
    </article>
  );
}
