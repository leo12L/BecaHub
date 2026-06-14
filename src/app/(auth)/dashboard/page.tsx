/**
 * Dashboard Page
 * Runtime dashboard backed by the same scholarship query layer used by /api/becas.
 */

import Link from "next/link";
import { connection } from "next/server";
import { BookOpen, CalendarClock, CheckCircle2, Globe2 } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecommendedScholarshipCard } from "@/components/dashboard/recommended-scholarship-card";
import { ImportantDatesCard } from "@/components/dashboard/important-dates-card";
import { SuggestionsCard } from "@/components/dashboard/suggestions-card";
import { PersonalizedRecommendations } from "@/components/dashboard/personalized-recommendations";
import {
  getBecas,
  getLandingStats,
  type BecaListItem,
} from "@/lib/becas/queries";
import {
  academicLevelLabels,
  coverageLabels,
  formatAmount,
  formatDate,
  getDeadlineInfo,
} from "@/lib/becas/format";
import { becasQuerySchema } from "@/validators/becas.validator";

const RECOMMENDED_LIMIT = 5;
const UPCOMING_LIMIT = 5;

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getScholarshipTags(scholarship: BecaListItem) {
  return [
    coverageLabels[scholarship.coverageType],
    academicLevelLabels[scholarship.academicLevel],
    ...scholarship.categories.slice(0, 2).map((category) => category.name),
  ];
}

function toRecommendedCard(scholarship: BecaListItem) {
  const deadline = getDeadlineInfo(scholarship.deadline, scholarship.status);

  return {
    id: scholarship.id,
    slug: scholarship.slug,
    title: scholarship.title,
    institution: scholarship.source.name,
    tags: getScholarshipTags(scholarship),
    deadlineLabel: deadline.label,
    applyUrl: scholarship.applyUrl,
    country: scholarship.countryDestination,
    description: scholarship.description,
    startLabel: formatDate(scholarship.createdAt),
    amount: formatAmount(
      scholarship.amountMin,
      scholarship.amountMax,
      scholarship.currency,
    ),
    verified: scholarship.isVerified,
  };
}

export default async function DashboardPage() {
  await connection();

  const deadlineBefore = daysFromNow(30);
  const upcomingParams = new URLSearchParams({
    deadlineBefore: deadlineBefore.toISOString(),
  });

  const [recommended, upcoming, stats] = await Promise.all([
    getBecas(becasQuerySchema.parse({ limit: RECOMMENDED_LIMIT }), {
      sort: "deadline",
    }),
    getBecas(
      becasQuerySchema.parse({
        limit: UPCOMING_LIMIT,
        deadlineBefore,
      }),
      { sort: "deadline" },
    ),
    getLandingStats(),
  ]);

  const summaryCards = [
    {
      title: "Convocatorias",
      value: stats.totalCount.toLocaleString("es-MX"),
      icon: <BookOpen className="size-5" />,
      description: "Registros disponibles en el catálogo.",
      highlighted: true,
    },
    {
      title: "Países destino",
      value: stats.countriesCount.toLocaleString("es-MX"),
      icon: <Globe2 className="size-5" />,
      description: "Cobertura geográfica del catálogo.",
      highlighted: false,
    },
    {
      title: "Verificación",
      value: `${stats.verifiedPercentage}%`,
      icon: <CheckCircle2 className="size-5" />,
      description: "Proporción de becas con fuente validada.",
      highlighted: false,
    },
    {
      title: "Cierres próximos",
      value: upcoming.pagination.total.toLocaleString("es-MX"),
      icon: <CalendarClock className="size-5" />,
      description: "Becas con fecha límite dentro de 30 días.",
      highlighted: false,
    },
  ];

  const deadlineEvents = upcoming.data.map((scholarship) => ({
    date: getDeadlineInfo(scholarship.deadline, scholarship.status).label,
    title: scholarship.title,
    href: `/becas/${scholarship.slug}`,
  }));

  const suggestions = [
    {
      text: "Completa tu perfil para que las recomendaciones usen tu nivel, país y tipo de beca.",
      href: "/perfil/asistente",
    },
    {
      text:
        upcoming.pagination.total > 0
          ? `Revisa ${upcoming.pagination.total.toLocaleString("es-MX")} convocatorias que cierran en los próximos 30 días.`
          : "Explora el catálogo completo y guarda tus filtros de búsqueda frecuentes.",
      href:
        upcoming.pagination.total > 0
          ? `/becas?${upcomingParams.toString()}`
          : "/becas",
    },
    {
      text: "Solicita una beca desde el formulario público si quieres registrar una oportunidad manualmente.",
      href: "/solicitud-beca",
    },
  ];

  return (
    <>
      <DashboardTopbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  Panel de oportunidades
                </p>
                <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight">
                  Resumen del catálogo
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  Datos en tiempo real del catálogo completo. El asistente de
                  perfil habilita recomendaciones más precisas según tus
                  intereses.
                </p>
              </div>

              <Link
                href="/becas"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Explorar catálogo
              </Link>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard key={card.title} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-foreground text-2xl font-semibold">
                      Oportunidades próximas
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Ordenadas por fecha límite desde la API de becas.
                    </p>
                  </div>
                </div>

                {recommended.data.length === 0 ? (
                  <div className="bg-card border-border rounded-lg border p-8 text-center">
                    <h3 className="text-foreground text-base font-semibold">
                      No hay convocatorias por mostrar
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Cuando el scraper o el panel admin registren nuevas becas,
                      aparecerán aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommended.data.map((scholarship) => (
                      <RecommendedScholarshipCard
                        key={scholarship.id}
                        {...toRecommendedCard(scholarship)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <aside className="space-y-6">
                <ImportantDatesCard events={deadlineEvents} />
                <SuggestionsCard suggestions={suggestions} />
              </aside>
            </div>

            <PersonalizedRecommendations />
          </div>
      </main>
    </>
  );
}
