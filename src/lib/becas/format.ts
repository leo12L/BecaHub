import type {
  AcademicLevel,
  CoverageType,
  ScholarshipStatus,
} from "@/generated/prisma/enums";

export const coverageLabels: Record<CoverageType, string> = {
  MONETARY: "Apoyo monetario",
  TRAVEL: "Viaje",
  TUITION: "Colegiatura",
  SPORTS: "Deportiva",
  RESEARCH: "Investigación",
  LEADERSHIP: "Liderazgo",
  FULL: "Beca completa",
};

export const academicLevelLabels: Record<AcademicLevel, string> = {
  HIGH_SCHOOL: "Bachillerato",
  UNDERGRAD: "Licenciatura",
  GRAD: "Maestría",
  PHD: "Doctorado",
  POSTDOC: "Posdoctorado",
  PROFESSIONAL: "Profesional",
};

export const statusLabels: Record<ScholarshipStatus, string> = {
  ACTIVE: "Activa",
  CLOSED: "Cerrada",
  DRAFT: "Borrador",
  PENDING_REVIEW: "En revisión",
};

type Numeric = number | string | { toString(): string };

/** Formatea un monto o rango de montos con su moneda, p.ej. "$1,000 - $2,400 MXN". */
export function formatAmount(
  amountMin: Numeric | null | undefined,
  amountMax: Numeric | null | undefined,
  currency: string,
): string | null {
  const min = amountMin != null ? Number(amountMin) : null;
  const max = amountMax != null ? Number(amountMax) : null;

  if (min == null && max == null) return null;

  const formatter = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  });

  if (min != null && max != null && min !== max) {
    return `$${formatter.format(min)} - $${formatter.format(max)} ${currency}`;
  }

  const value = min ?? max ?? 0;
  return `$${formatter.format(value)} ${currency}`;
}

export type DeadlineInfo = {
  label: string;
  variant: "default" | "warning" | "urgent" | "closed" | "muted";
};

/** Calcula el texto y urgencia de la fecha límite, considerando el status. */
export function getDeadlineInfo(
  deadline: Date | string | null | undefined,
  status: ScholarshipStatus,
): DeadlineInfo {
  if (status === "CLOSED") {
    return { label: "Cerrada", variant: "closed" };
  }

  if (!deadline) {
    return { label: "Sin fecha límite", variant: "muted" };
  }

  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / msPerDay,
  );

  if (diffDays < 0) {
    return { label: "Cerrada", variant: "closed" };
  }

  if (diffDays === 0) {
    return { label: "Cierra hoy", variant: "urgent" };
  }

  if (diffDays === 1) {
    return { label: "Cierra mañana", variant: "urgent" };
  }

  if (diffDays <= 7) {
    return { label: `Cierra en ${diffDays} días`, variant: "urgent" };
  }

  if (diffDays <= 30) {
    return { label: `Cierra en ${diffDays} días`, variant: "warning" };
  }

  return {
    label: `Cierra el ${deadlineDate.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    variant: "default",
  };
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
