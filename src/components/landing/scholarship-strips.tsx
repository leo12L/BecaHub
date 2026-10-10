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
    <div className="landing-strips pointer-events-none absolute inset-[-42%] z-0 md:inset-[-32%]">
      <div className="landing-strips-board" data-testid="landing-strips">
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
