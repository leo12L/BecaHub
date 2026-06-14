import type { Metadata } from "next";

import { ScholarshipApplicationForm } from "@/components/forms/ScholarshipApplicationForm";

export const metadata: Metadata = {
  title: "Registro de solicitud de beca",
  description:
    "Completa tus datos para encontrar oportunidades de beca que se adapten a tu perfil.",
};

export default function SolicitudBecaPage() {
  return (
    <div className="bg-secondary/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          Registro de solicitud de beca
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          Completa tus datos para encontrar oportunidades que se adapten a tu
          perfil.
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          No te preocupes, podrás editar esta información más adelante.
        </p>
      </div>

      <div className="mt-10">
        <ScholarshipApplicationForm />
      </div>
    </div>
  );
}
