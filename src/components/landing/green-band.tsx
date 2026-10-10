import { LandingWordmark } from "@/components/landing/landing-wordmark";

export function GreenBand() {
  return (
    <section className="lf-band" data-testid="landing-band" aria-hidden="false">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-end md:py-20">
        <div>
          <LandingWordmark inverted />
          <p className="lf-display mt-8 text-4xl text-white sm:text-5xl">
            Tu próxima oportunidad.
          </p>
        </div>
        <div className="md:text-right">
          <p className="lf-eyebrow">01 / Descubre</p>
          <p className="lf-display mt-4 text-3xl text-white sm:text-4xl">
            Oportunidades que mereces conocer.
          </p>
        </div>
      </div>
    </section>
  );
}
