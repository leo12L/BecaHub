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
        <section className="px-4 py-16">
          <div className="mx-auto flex max-w-screen-lg flex-col items-center gap-4">
            <p className="max-w-sm text-center text-sm text-[#6B7280]">
              Para acceder a recomendaciones personalizadas, inicia sesión o
              crea una cuenta gratuita.
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
