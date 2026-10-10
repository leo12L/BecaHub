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
        <StripCard key={`duplicate-${card.id}`} card={card} copy="duplicate" />
      ))}
    </div>
  );
}

export function ScholarshipStrips({ cards }: { cards: LandingStripCard[] }) {
  const columns = splitIntoColumns(cards, COLUMN_COUNT);

  return (
    <div className="landing-strips pointer-events-none absolute inset-[-20%] z-0">
      <div
        className="absolute top-1/2 left-1/2 flex origin-center -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] gap-3 md:gap-4"
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
