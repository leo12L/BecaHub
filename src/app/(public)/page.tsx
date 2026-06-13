import Link from "next/link";
import {
  Search,
  BellRing,
  ListChecks,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearchForm } from "@/components/scholarships/hero-search-form";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { getFeaturedBecas, getFilterCategories } from "@/lib/becas/queries";

const steps = [
  {
    icon: Search,
    title: "Explora y filtra",
    description:
      "Busca por palabra clave o filtra por tipo, área, país, nivel académico y fecha límite.",
  },
  {
    icon: ListChecks,
    title: "Revisa los detalles",
    description:
      "Cada beca muestra cobertura, monto, requisitos y la fuente original de la convocatoria.",
  },
  {
    icon: BellRing,
    title: "Postula directo",
    description:
      "Te llevamos al sitio oficial de cada beca para que hagas tu solicitud sin intermediarios.",
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedBecas(),
    getFilterCategories(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-border from-accent/40 to-background border-b bg-gradient-to-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
            <Sparkles className="size-4" aria-hidden="true" />
            Becas verificadas, en un solo lugar
          </span>
          <h1 className="text-foreground max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Encuentra la beca que impulsa tu siguiente paso
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            BecaHub reúne convocatorias de becas para estudiar, viajar e
            investigar, organizadas por tipo, área y nivel académico para que
            encuentres oportunidades reales más rápido.
          </p>
          <div className="w-full max-w-2xl">
            <HeroSearchForm />
          </div>
        </div>
      </section>

      {/* Destacadas */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight">
              Becas destacadas
            </h2>
            <Link
              href="/becas"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Ver todas
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        </section>
      )}

      {/* Explorar por categoría */}
      <section className="border-border bg-muted/30 border-t">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">
            Explora por categoría
          </h2>
          <p className="text-muted-foreground mt-1">
            Encuentra becas según el tipo de apoyo o tu área de interés.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Tipo de beca
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.type.map((category) => (
                  <CategoryLink
                    key={category.id}
                    category={category}
                    param="type"
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Área de estudio
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.area.map((category) => (
                  <CategoryLink
                    key={category.id}
                    category={category}
                    param="area"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
          Cómo funciona BecaHub
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-foreground text-base font-semibold">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/becas">
              Explorar becas
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function CategoryLink({
  category,
  param,
}: {
  category: { id: string; name: string; slug: string; colorHex: string };
  param: "type" | "area";
}) {
  return (
    <Link
      href={`/becas?${param}=${category.slug}`}
      className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
    >
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: category.colorHex }}
        aria-hidden="true"
      />
      {category.name}
    </Link>
  );
}
