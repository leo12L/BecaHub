import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
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
} from "@/lib/becas/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const beca = await getBecaBySlug(slug);

  if (!beca || beca.status !== "ACTIVE") {
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

  if (!beca || beca.status !== "ACTIVE") {
    notFound();
  }

  const amount = formatAmount(beca.amountMin, beca.amountMax, beca.currency);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav
        aria-label="Ruta de navegación"
        className="text-muted-foreground text-sm"
      >
        <Link href="/becas" className="hover:text-foreground">
          Explorar becas
        </Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CoverageBadge coverageType={beca.coverageType} />
        {beca.categories.map((category) => (
          <CategoryBadge key={category.id} category={category} />
        ))}
      </div>

      <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {beca.title}
      </h1>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5">
          <Landmark className="size-4" aria-hidden="true" />
          {beca.source.name}
        </span>
        <DeadlineBadge deadline={beca.deadline} status={beca.status} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="text-foreground text-lg font-semibold">
              Descripción
            </h2>
            <p className="text-muted-foreground mt-2 whitespace-pre-line">
              {beca.description}
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Detalles</h2>
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {beca.deadline && (
                <DetailItem
                  icon={Globe}
                  label="Fecha límite"
                  value={formatDate(beca.deadline)}
                />
              )}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>¿Te interesa esta beca?</CardTitle>
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

              {/* TODO(auth): habilitar "Guardar" cuando exista autenticación
                  de usuarios (Favorite model ya está listo en el schema). */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
                title="Inicia sesión para guardar becas"
              >
                <Bookmark aria-hidden="true" />
                Guardar (inicia sesión)
              </Button>

              {/* TODO(auth): habilitar "Ya postulé" cuando exista
                  autenticación de usuarios (Application model ya está
                  listo en el schema). */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
                title="Inicia sesión para llevar el seguimiento de tus postulaciones"
              >
                <CheckCircle2 aria-hidden="true" />
                Ya postulé (inicia sesión)
              </Button>

              <p className="text-muted-foreground text-xs">
                Esta beca enlaza a su convocatoria oficial. Verifica los
                requisitos y plazos directamente en el sitio de la fuente.
              </p>
            </CardContent>
          </Card>
        </aside>
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
    <div className="flex items-start gap-2.5">
      <Icon
        className="text-muted-foreground mt-0.5 size-4 shrink-0"
        aria-hidden
      />
      <div>
        <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </dt>
        <dd className="text-foreground text-sm">{value}</dd>
      </div>
    </div>
  );
}
