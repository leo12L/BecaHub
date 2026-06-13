/**
 * Scholarship Vertical Carousel Component
 * Infinite vertical scrolling carousel with CSS animations.
 * No external libraries, pure CSS.
 */

import "./scholarship-vertical-carousel.css";

interface Scholarship {
  id: number;
  name: string;
  institution: string;
  level: string;
  coverage: string;
  deadline: string;
  compatibility: number;
  mode: string;
}

const scholarshipsData: Scholarship[] = [
  {
    id: 1,
    name: "Beca de Excelencia Académica",
    institution: "Universidad Nacional Autónoma",
    level: "Maestría",
    coverage: "100% Cobertura",
    deadline: "15 Nov",
    compatibility: 98,
    mode: "Presencial",
  },
  {
    id: 2,
    name: "Fundación Internacional STEM",
    institution: "Global Education Trust",
    level: "Investigación",
    coverage: "$50k USD",
    deadline: "01 Dic",
    compatibility: 92,
    mode: "Remoto",
  },
  {
    id: 3,
    name: "Jóvenes Investigadores LATAM",
    institution: "CONACYT",
    level: "Doctorado",
    coverage: "Beca completa",
    deadline: "20 Nov",
    compatibility: 89,
    mode: "Híbrido",
  },
  {
    id: 4,
    name: "Mujeres en Tecnología",
    institution: "Santander Universidades",
    level: "Licenciatura / Posgrado",
    coverage: "$15k USD",
    deadline: "30 Nov",
    compatibility: 85,
    mode: "Remoto",
  },
  {
    id: 5,
    name: "Movilidad Global Edu",
    institution: "OEA / OAS",
    level: "Posgrado",
    coverage: "Parcial",
    deadline: "10 Dic",
    compatibility: 81,
    mode: "Presencial",
  },
  {
    id: 6,
    name: "Beca Fulbright México",
    institution: "U.S. Embassy Mexico",
    level: "Maestría / Doctorado",
    coverage: "100% + viáticos",
    deadline: "15 Dic",
    compatibility: 94,
    mode: "Presencial",
  },
  {
    id: 7,
    name: "Erasmus+ Latinoamérica",
    institution: "Unión Europea",
    level: "Movilidad estudiantil",
    coverage: "€1,000/mes",
    deadline: "28 Nov",
    compatibility: 77,
    mode: "Presencial",
  },
  {
    id: 8,
    name: "DAAD Research Grant",
    institution: "DAAD Alemania",
    level: "Investigación doctoral",
    coverage: "€1,200/mes + seguro",
    deadline: "05 Dic",
    compatibility: 83,
    mode: "Presencial",
  },
];

function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  return (
    <div className="bg-white border border-[#E8E8E8] rounded-lg p-4 flex-shrink-0 w-full">
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{scholarship.name}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{scholarship.institution}</p>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mt-3">
        <span className="bg-[#004451]/10 text-[#004451] text-xs px-2 py-0.5 rounded-md">
          {scholarship.coverage}
        </span>
        <span className="bg-[#F0F0F0] text-[#6B7280] text-xs px-2 py-0.5 rounded-md">
          {scholarship.mode}
        </span>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-2">
        <span className="bg-[#800020]/10 text-[#800020] text-xs px-2.5 py-0.5 rounded-full font-medium">
          ● {scholarship.compatibility}% match
        </span>
        <span className="text-xs text-[#6B7280]">Cierra: {scholarship.deadline}</span>
      </div>
    </div>
  );
}

export function ScholarshipVerticalCarousel() {
  // Duplicate array for infinite loop
  const duplicatedScholarships = [...scholarshipsData, ...scholarshipsData];

  return (
    <div
      className="scholarship-carousel-container hidden lg:block"
      style={{
        overflow: "hidden",
        height: "480px",
        position: "relative",
      }}
    >
      {/* Mask gradient */}
      <div
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          height: "100%",
          position: "relative",
        }}
      >
        <div className="scholarship-carousel-inner">
          {duplicatedScholarships.map((scholarship, index) => (
            <ScholarshipCard key={`${scholarship.id}-${index}`} scholarship={scholarship} />
          ))}
        </div>
      </div>
    </div>
  );
}
