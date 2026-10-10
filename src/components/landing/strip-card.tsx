import Link from "next/link";
import type { LandingStripCard } from "@/lib/becas/landing-cards";

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
    ? "border-primary/25 bg-card w-[220px] rounded-xl border border-dashed p-3 shadow-sm"
    : "border-border bg-card w-[220px] rounded-xl border p-3 shadow-sm";

  const body = (
    <>
      {isExample ? (
        <p className="text-primary mb-1 text-[10px] font-bold tracking-wide uppercase">
          Ejemplo
        </p>
      ) : null}
      <p className="text-foreground line-clamp-2 text-sm font-bold">
        {card.title}
      </p>
      <p className="text-muted-foreground mt-1 truncate text-xs">
        {card.sourceName} · {card.country}
      </p>
      <p className="text-primary mt-2 text-[11px] font-semibold">
        {card.coverageLabel} · {card.deadlineLabel}
      </p>
    </>
  );

  if (isExample || isDuplicate || !card.href) {
    return (
      <article
        className={className}
        data-landing-card={card.kind}
        data-strip-copy={copy}
        data-card-id={card.id}
        aria-hidden={decorative ? true : undefined}
      >
        {body}
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
        {body}
      </Link>
    </article>
  );
}
