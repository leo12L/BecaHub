import {
  splitIntoColumns,
  type LandingStripCard,
} from "@/lib/becas/landing-cards";
import { StripCard } from "@/components/landing/strip-card";
import "./landing-motion.css";

const COLUMN_COUNT = 4;

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
    <div
      className="landing-strips pointer-events-none absolute inset-0 z-0 overflow-hidden"
      data-testid="landing-strips"
    >
      <div
        className="landing-strips-cluster landing-strips-cluster--left"
        data-landing-cluster="left"
      >
        <StripColumn cards={columns[0] ?? []} direction="up" speed="normal" />
        <StripColumn cards={columns[1] ?? []} direction="down" speed="slow" />
      </div>
      <div
        className="landing-strips-cluster landing-strips-cluster--right"
        data-landing-cluster="right"
      >
        <StripColumn cards={columns[2] ?? []} direction="up" speed="slow" />
        <StripColumn cards={columns[3] ?? []} direction="down" speed="normal" />
      </div>
    </div>
  );
}
