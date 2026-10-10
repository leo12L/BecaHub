import Link from "next/link";

const steps = [
  {
    n: "01",
    eyebrow: "El comienzo",
    title: "Encuentra lo que va contigo",
    body: "Identifica el tipo de apoyo que buscas y explora las opciones que conectan con tus intereses.",
  },
  {
    n: "02",
    eyebrow: "La preparación",
    title: "Prepara tu siguiente paso",
    body: "Revisa fechas, requisitos y documentos en la convocatoria oficial antes de postular.",
  },
  {
    n: "03",
    eyebrow: "Tu oportunidad",
    title: "Envía tu postulación",
    body: "Completa tu solicitud en el sitio oficial de la convocatoria y guarda la confirmación para dar seguimiento.",
  },
];

export function StepsSection() {
  return (
    <section
      id="como-funciona"
      className="lf-section scroll-mt-8"
      data-testid="landing-pasos"
    >
      <div className="lf-section-inner lf-steps max-w-6xl">
        <div>
          <p className="lf-eyebrow">De la curiosidad a la acción</p>
          <h2 className="lf-display mt-4 text-4xl sm:text-5xl">
            Encuentra.
            <br />
            Prepárate.
            <br />
            Postula.
          </h2>
          <p className="mt-5 max-w-sm text-[1.02rem] leading-relaxed text-[var(--lf-muted)]">
            Un camino más claro hacia tu próxima oportunidad.
          </p>
          <Link href="#comunidad" className="lf-link mt-8">
            Sigue bajando ↓
          </Link>
        </div>

        <ol>
          {steps.map((step) => (
            <li key={step.n} className="lf-step mb-12 last:mb-0">
              <span className="lf-step-n" aria-hidden="true">
                {step.n}
              </span>
              <p className="lf-eyebrow">{step.eyebrow}</p>
              <h3 className="lf-display mt-2 text-2xl sm:text-3xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
