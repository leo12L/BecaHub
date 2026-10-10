import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "./landing-motion.css";

const blocks = [
  {
    eyebrow: "Un solo lugar",
    title: "Deja de cazar convocatorias en mil páginas",
    body: "Reunimos becas de universidades, gobierno y organismos internacionales. Cada ficha lleva fechas, cobertura y el enlace oficial para que confirmes en la fuente.",
    href: "/becas",
    cta: "Ver el catálogo",
    image: {
      src: "/images/landing/estudiantes-colaborando.jpg",
      alt: "Grupo de estudiantes universitarios colaborando alrededor de una mesa con computadoras portátiles.",
      credit: "Foto: Brooke Cagle / Unsplash (licencia Unsplash)",
    },
    imageSide: "left" as const,
  },
  {
    eyebrow: "A tu medida",
    title: "Te recomendamos becas que sí van con tu perfil",
    body: "Cuentas tu nivel, el área que te interesa y a dónde quieres ir. Nosotros filtramos el ruido y te dejamos una lista corta para guardar favoritos y dar seguimiento.",
    href: "/login",
    cta: "Armar mi perfil",
    image: {
      src: "/images/landing/estudiantes-biblioteca.jpg",
      alt: "Estudiantes sentados juntos en un edificio universitario, conversando entre clases.",
      credit: "Foto: Priscilla Du Preez / Unsplash (licencia Unsplash)",
    },
    imageSide: "right" as const,
  },
];

export function FeatureBlocks() {
  return (
    <div className="bg-background border-border border-t">
      {blocks.map((block) => (
        <section
          key={block.title}
          className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24"
        >
          <figure
            className={block.imageSide === "left" ? "lg:order-1" : "lg:order-2"}
          >
            <div className="landing-photo-tilt" data-landing-photo>
              <Image
                src={block.image.src}
                alt={block.image.alt}
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 100vw, 560px"
                className="border-border aspect-[3/2] w-full rounded-3xl border object-cover shadow-md"
              />
            </div>
            <figcaption className="text-muted-foreground mt-3 text-xs">
              {block.image.credit}
            </figcaption>
          </figure>

          <div
            className={block.imageSide === "left" ? "lg:order-2" : "lg:order-1"}
          >
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
              {block.eyebrow}
            </p>
            <h2 className="text-foreground mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              {block.title}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
              {block.body}
            </p>
            <Link
              href={block.href}
              className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-bold"
            >
              {block.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
