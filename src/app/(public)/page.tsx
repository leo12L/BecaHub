/**
 * Landing Page - Public Home
 * Main landing page for BecaHub platform.
 */

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { AuthOptionsCard } from "@/components/landing/auth-options-card";
import { SocialProof } from "@/components/landing/social-proof";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <LandingNavbar />

      <main>
        <HeroSection />

        {/* Auth options section */}
        <section className="py-16 px-4">
          <div className="max-w-screen-lg mx-auto flex flex-col items-center gap-4">
            <p className="text-sm text-[#6B7280] text-center max-w-sm">
              Para acceder a recomendaciones personalizadas, inicia sesión o crea una cuenta gratuita.
            </p>
            <AuthOptionsCard />
          </div>
        </section>

        {/* Social proof */}
        <SocialProof />
      </main>
    </div>
  );
}
