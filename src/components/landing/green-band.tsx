import Link from "next/link";
import { LandingWordmark } from "@/components/landing/landing-wordmark";

export function GreenBand() {
  return (
    <section className="lf-band" data-testid="landing-band">
      <div className="lf-band-shape" aria-hidden="true" />
      <div className="lf-band-row">
        <Link href="/" className="lf-band-brand" aria-label="BecaHub">
          <LandingWordmark inverted />
          <span aria-hidden="true">↗</span>
        </Link>
        <p className="lf-eyebrow lf-band-label">01 / DESCUBRE</p>
      </div>
      <p className="lf-display lf-band-title">Tu próxima oportunidad.</p>
    </section>
  );
}
