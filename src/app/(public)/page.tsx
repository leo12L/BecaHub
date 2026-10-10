import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { GreenBand } from "@/components/landing/green-band";
import { DiscoverSection } from "@/components/landing/discover-section";
import { PrepareSection } from "@/components/landing/prepare-section";
import { StepsSection } from "@/components/landing/steps-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import "@/components/landing/landing-ref.css";

export default function LandingPage() {
  return (
    <div className="landing-ref min-h-screen">
      <div className="relative">
        <LandingNavbar />
        <HeroSection />
      </div>
      <main>
        <GreenBand />
        <DiscoverSection />
        <PrepareSection />
        <StepsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
