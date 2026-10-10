import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { AuthOptionsCard } from "@/components/landing/auth-options-card";
import { SocialProof } from "@/components/landing/social-proof";
import { DestinationSelector } from "@/components/globe/destination-selector";
import { CategoryCarousel } from "@/components/carousel/category-carousel";
import { getBecas, getLandingStats } from "@/lib/becas/queries";
import { becasQuerySchema } from "@/validators/becas.validator";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [{ data: scholarships }, stats] = await Promise.all([
    getBecas(becasQuerySchema.parse({ limit: 100 }), { sort: "deadline" }),
    getLandingStats(),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <LandingNavbar />

      <main>
        <HeroSection scholarships={scholarships} stats={stats} />

        {/* Interactive globe with destination selector */}
        <DestinationSelector scholarships={scholarships} />

        {/* Category carousel */}
        <CategoryCarousel scholarships={scholarships} />

        {/* Auth options */}
        <section className="border-border bg-background border-t px-4 py-16">
          <div className="mx-auto flex max-w-screen-lg justify-center">
            <AuthOptionsCard />
          </div>
        </section>

        <SocialProof />
      </main>
    </div>
  );
}
