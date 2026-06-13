import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function buildHref(
  searchParams: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/becas?${query}` : "/becas";
}

export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex items-center justify-center gap-2"
    >
      <PaginationLink
        href={buildHref(searchParams, page - 1)}
        disabled={!hasPrev}
        aria-label="Página anterior"
      >
        <ChevronLeft aria-hidden="true" />
        Anterior
      </PaginationLink>

      <span className="text-muted-foreground px-2 text-sm" aria-live="polite">
        Página {page} de {totalPages}
      </span>

      <PaginationLink
        href={buildHref(searchParams, page + 1)}
        disabled={!hasNext}
        aria-label="Página siguiente"
      >
        Siguiente
        <ChevronRight aria-hidden="true" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-none opacity-50",
        )}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "outline" })}
      {...props}
    >
      {children}
    </Link>
  );
}
