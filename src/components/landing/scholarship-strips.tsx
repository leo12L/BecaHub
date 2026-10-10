import {
  splitIntoColumns,
  type LandingStripCard,
} from "@/lib/becas/landing-cards";
import { StripCard } from "@/components/landing/strip-card";
import "./landing-motion.css";

const COLUMN_COUNT = 3;

function StripColumn({
  cards,
  direction,
  speed,
}: {
  cards: LandingStripCard[];
  direction: "up" | "down";
  speed: "normal" | "slow";
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="landing-strip-track"
        data-landing-strip
        data-direction={direction}
        data-speed={speed}
      >
        {cards.map((card) => (
          <StripCard key={`original-${card.id}`} card={card} copy="original" />
        ))}
        {cards.map((card) => (
          <StripCard
            key={`duplicate-${card.id}`}
            card={card}
            copy="duplicate"
          />
        ))}
      </div>
    </div>
  );
}

export function ScholarshipStrips({ cards }: { cards: LandingStripCard[] }) {
  const columns = splitIntoColumns(cards, COLUMN_COUNT);

  return (
    <div
      className="landing-strips pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden={false}
    >
      <div
        className="absolute top-1/2 left-1/2 flex h-[160%] origin-center -translate-x-1/2 -translate-y-1/2 -rotate-[16deg] gap-4"
        data-testid="landing-strips"
      >
        {columns.map((columnCards, index) => (
          <StripColumn
            key={index}
            cards={columnCards}
            direction={index % 2 === 0 ? "up" : "down"}
            speed={index === 1 ? "slow" : "normal"}
          />
        ))}
      </div>
    </div>
  );
}
