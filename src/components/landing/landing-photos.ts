export type LandingPhoto = {
  src: string;
  alt: string;
  credit: string;
  tag?: string;
};

export const HERO_TILES: Array<LandingPhoto & { slot: string; tag: string }> = [
  {
    slot: "a",
    src: "/images/landing/hero-laptop.jpg",
    alt: "Manos escribiendo en un cuaderno junto a dos laptops abiertas.",
    credit: "Foto: Scott Graham / Unsplash",
    tag: "Universidad",
  },
  {
    slot: "b",
    src: "/images/landing/hero-cafe.jpg",
    alt: "Manos tecleando en una laptop durante una sesión de estudio.",
    credit: "Foto: Glenn Carstens-Peters / Unsplash",
    tag: "Nuevos caminos",
  },
  {
    slot: "c",
    src: "/images/landing/hero-mesa.jpg",
    alt: "Tres estudiantes conversando alrededor de una mesa con laptops.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Movilidad",
  },
  {
    slot: "d",
    src: "/images/landing/hero-grupo.jpg",
    alt: "Estudiantes riendo frente a una laptop en una biblioteca.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Apoyo económico",
  },
  {
    slot: "e",
    src: "/images/landing/hero-libros.jpg",
    alt: "Pila de libros de colores sobre una mesa de estudio.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Cursos",
  },
  {
    slot: "f",
    src: "/images/landing/prepare-laptop.jpg",
    alt: "Laptop, café, notas y teléfono sobre un escritorio de madera.",
    credit: "Foto: Andrew Neel / Unsplash",
    tag: "Deporte",
  },
  {
    slot: "g",
    src: "/images/landing/estudiantes-colaborando.jpg",
    alt: "Grupo de estudiantes universitarios colaborando alrededor de una mesa.",
    credit: "Foto: Brooke Cagle / Unsplash",
    tag: "Movilidad",
  },
  {
    slot: "h",
    src: "/images/landing/carousel-cursos.jpg",
    alt: "Persona escribiendo a mano en un cuaderno junto a una taza.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Apoyo económico",
  },
];

export const DISCOVER_SLIDES: LandingPhoto[] = [
  {
    src: "/images/landing/hero-grupo.jpg",
    alt: "Estudiantes colaborando frente a una laptop en una biblioteca universitaria.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Comunidad",
  },
  {
    src: "/images/landing/carousel-cursos.jpg",
    alt: "Estudiante tomando apuntes a mano en un cuaderno.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Cursos",
  },
  {
    src: "/images/landing/estudiantes-aula.jpg",
    alt: "Estudiantes universitarios riendo mientras estudian juntos frente a una laptop.",
    credit: "Foto: Priscilla Du Preez / Unsplash",
    tag: "Universidad",
  },
];

export const PREPARE_SLIDES: LandingPhoto[] = [
  {
    src: "/images/landing/hero-laptop.jpg",
    alt: "Persona tomando notas al lado de una laptop, preparando una postulación.",
    credit: "Foto: Scott Graham / Unsplash",
    tag: "Nuevos caminos",
  },
  {
    src: "/images/landing/prepare-laptop.jpg",
    alt: "Escritorio con laptop, café y un bloc de notas listo para organizar documentos.",
    credit: "Foto: Andrew Neel / Unsplash",
    tag: "Documentos",
  },
  {
    src: "/images/landing/prepare-notas.jpg",
    alt: "Mano con suéter gris escribiendo requisitos en un cuaderno.",
    credit: "Foto: Unsplash (licencia Unsplash)",
    tag: "Requisitos",
  },
];
