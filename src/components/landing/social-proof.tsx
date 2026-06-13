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
    <section className="border-t border-[#E8E8E8] bg-[#F5F5F5] px-4 py-8">
      <div className="mx-auto max-w-screen-xl">
        <p className="mb-4 text-center text-xs font-medium tracking-wide text-[#6B7280] uppercase">
          Convocatorias de instituciones como:
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {institutions.map((institution) => (
            <div
              key={institution}
              className="rounded-md border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs whitespace-nowrap text-[#1A1A1A]"
            >
              {institution}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
