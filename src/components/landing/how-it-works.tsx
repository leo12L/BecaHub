const steps = [
  {
    n: "01",
    title: "Creas tu cuenta y perfil",
    body: "Nos cuentas tu nivel, el área que te late y si buscas quedarte en México o salir. Una sola vez.",
  },
  {
    n: "02",
    title: "Te recomendamos becas",
    body: "Filtramos convocatorias vigentes que coinciden con tu perfil. Tú decides cuáles vale la pena abrir.",
  },
  {
    n: "03",
    title: "Guardas favoritos",
    body: "Marcas las que te interesan para no perder la fecha de cierre ni el enlace oficial.",
  },
  {
    n: "04",
    title: "Postulas y das seguimiento",
    body: "Postulas en el sitio oficial de la beca y en BecaHub anotas cómo vas: interesada, enviada, entrevista o resultado.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="border-border bg-secondary/60 border-t px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Del registro a la postulación
        </p>
        <h2 className="text-foreground mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Cómo funciona
        </h2>
      </div>

      <ol className="relative mx-auto mt-14 max-w-4xl">
        <div
          className="bg-primary/40 absolute top-0 left-6 h-full w-px md:left-1/2 md:-translate-x-1/2"
          aria-hidden="true"
        />
        {steps.map((step, index) => {
          const onRight = index % 2 === 1;
          return (
            <li
              key={step.n}
              className="relative mb-10 grid items-start gap-4 pl-16 md:mb-16 md:grid-cols-2 md:gap-12 md:pl-0"
            >
              <span
                className="border-border bg-card text-primary absolute top-1 left-3 flex size-7 items-center justify-center rounded-full border text-xs font-extrabold md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <div
                className={
                  onRight
                    ? "border-border bg-card rounded-2xl border p-5 shadow-sm md:col-start-2"
                    : "border-border bg-card rounded-2xl border p-5 shadow-sm md:col-start-1 md:text-right"
                }
              >
                <h3 className="text-foreground text-lg font-bold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
