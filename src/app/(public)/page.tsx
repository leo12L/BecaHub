/**
 * Landing Page - Public Home
 * Main landing page for BecaHub platform.
 */

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { AuthOptionsCard } from "@/components/landing/auth-options-card";
import { SocialProof } from "@/components/landing/social-proof";
import { getBecas, getLandingStats } from "@/lib/becas/queries";
import { becasQuerySchema } from "@/validators/becas.validator";

export default async function LandingPage() {
  const [{ data: scholarships }, stats] = await Promise.all([
    getBecas(becasQuerySchema.parse({ limit: 8 }), { sort: "deadline" }),
    getLandingStats(),
  ]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <LandingNavbar />

      <main>
        <HeroSection scholarships={scholarships} stats={stats} />

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
