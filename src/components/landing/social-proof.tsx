/**
 * Social Proof Component
 * Displays logos/names of partner institutions.
 */

const institutions = [
  "UNAM",
  "Fulbright",
  "CONACYT",
  "OEA",
  "DAAD",
  "Santander",
  "Erasmus+",
  "MIT",
];

export function SocialProof() {
  return (
    <section className="border-border bg-secondary border-t px-4 py-8">
      <div className="mx-auto max-w-screen-xl">
        <p className="text-muted-foreground mb-4 text-center text-xs font-medium tracking-wide uppercase">
          Convocatorias de instituciones como:
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {institutions.map((institution) => (
            <div
              key={institution}
              className="border-border text-foreground rounded-md border bg-white px-3 py-1.5 text-xs whitespace-nowrap"
            >
              {institution}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
