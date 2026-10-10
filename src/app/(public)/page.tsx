import { LandingNavbar } from "@/components/landing/landing-navbar";
import "@/components/landing/landing-motion.css";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureBlocks } from "@/components/landing/feature-blocks";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { getLandingStripBecas } from "@/lib/becas/landing";
import { getLandingStats } from "@/lib/becas/queries";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [cards, stats] = await Promise.all([
    getLandingStripBecas(),
    getLandingStats(),
  ]);

  return (
    <div className="landing-page bg-background min-h-screen">
      <LandingNavbar />
      <main>
        <HeroSection cards={cards} stats={stats} />
        <FeatureBlocks />
        <HowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}
