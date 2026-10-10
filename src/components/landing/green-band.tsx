import { LandingWordmark } from "@/components/landing/landing-wordmark";

export function GreenBand() {
  return (
    <section className="lf-band" data-testid="landing-band">
      <div className="lf-band-green">
        <LandingWordmark inverted />
        <p className="lf-display mt-10 text-4xl text-white sm:text-5xl">
          Tu próxima oportunidad.
        </p>
      </div>
      <div className="lf-band-copy">
        <p className="lf-eyebrow">01 / Descubre</p>
        <p className="lf-display mt-4 text-4xl sm:text-5xl">
          Oportunidades que mereces conocer.
        </p>
      </div>
    </section>
  );
}
