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
    <section className="bg-[#F5F5F5] border-t border-[#E8E8E8] py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <p className="text-xs text-[#6B7280] uppercase tracking-wide text-center mb-4 font-medium">
          Convocatorias de instituciones como:
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {institutions.map((institution) => (
            <div
              key={institution}
              className="border border-[#E8E8E8] bg-white text-[#1A1A1A] text-xs px-3 py-1.5 rounded-md whitespace-nowrap"
            >
              {institution}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
