import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bot,
  CalendarDays,
  ExternalLink,
  Globe,
  GraduationCap,
  Landmark,
  MapPin,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/scholarships/category-badge";
import { CoverageBadge } from "@/components/scholarships/coverage-badge";
import { DeadlineBadge } from "@/components/scholarships/deadline-badge";
import { getBecaBySlug } from "@/lib/becas/queries";
import {
  academicLevelLabels,
  formatAmount,
  formatDate,
  statusLabels,
} from "@/lib/becas/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const beca = await getBecaBySlug(slug);

  if (!beca) {
    return { title: "Beca no encontrada" };
  }

  const description = beca.description.slice(0, 160);

  return {
    title: beca.title,
    description,
    openGraph: {
      title: beca.title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: beca.title,
      description,
    },
  };
}

export default async function BecaDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const beca = await getBecaBySlug(slug);

  if (!beca) {
    notFound();
  }

  const amount = formatAmount(beca.amountMin, beca.amountMax, beca.currency);
  const publishedDate = formatDate(beca.createdAt);
  const closingDate = beca.deadline ? formatDate(beca.deadline) : "Sin fecha";

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Ruta de navegación"
          className="text-muted-foreground text-sm"
        >
          <Link href="/becas" className="hover:text-primary">
            Explorar becas
          </Link>
        </nav>

        <header className="border-border bg-card mt-4 rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <CoverageBadge coverageType={beca.coverageType} />
            <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
              {statusLabels[beca.status]}
            </span>
            {beca.categories.map((category) => (
              <CategoryBadge key={category.id} category={category} />
            ))}
          </div>

          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {beca.title}
          </h1>

          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Landmark className="text-highlight size-4" aria-hidden="true" />
              {beca.source.name}
            </span>
            <DeadlineBadge deadline={beca.deadline} status={beca.status} />
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
              <h2 className="text-foreground text-lg font-semibold">
                Descripción
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7 whitespace-pre-line">
                {beca.description}
              </p>
            </section>

            <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
              <h2 className="text-foreground text-lg font-semibold">
                Detalles
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={CalendarDays}
                  label="Fecha de inicio"
                  value={publishedDate}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Fecha de cierre"
                  value={closingDate}
                />
                <DetailItem
                  icon={Wallet}
                  label="Cobertura"
                  value={amount ?? "Monto no especificado"}
                />
                <DetailItem
                  icon={GraduationCap}
                  label="Nivel académico"
                  value={academicLevelLabels[beca.academicLevel]}
                />
                <DetailItem
                  icon={MapPin}
                  label="País destino"
                  value={beca.countryDestination}
                />
                <DetailItem
                  icon={Landmark}
                  label="Estado de la convocatoria"
                  value={statusLabels[beca.status]}
                />
                {beca.countryOrigin && (
                  <DetailItem
                    icon={MapPin}
                    label="País de origen elegible"
                    value={beca.countryOrigin}
                  />
                )}
                {beca.language && (
                  <DetailItem
                    icon={Globe}
                    label="Idioma"
                    value={beca.language.toUpperCase()}
                  />
                )}
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <a
                    href={beca.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ir a la convocatoria
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>

                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/perfil/asistente">
                    Revisar mi perfil
                    <Bot aria-hidden="true" />
                  </Link>
                </Button>

                <p className="text-muted-foreground text-xs leading-5">
                  La información viene de la fuente oficial. Verifica requisitos
                  y plazos antes de postular.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border bg-secondary/45 rounded-xl border p-4">
      <dt className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase">
        <Icon className="text-highlight size-4" aria-hidden />
        {label}
      </dt>
      <dd className="text-foreground mt-2 text-sm font-semibold">{value}</dd>
    </div>
  );
}
