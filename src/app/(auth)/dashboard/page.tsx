/**
 * Dashboard Page
 * Main dashboard skeleton with sidebar, topbar, summary cards,
 * recommended scholarships, and important dates/suggestions panels.
 */

"use client";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecommendedScholarshipCard } from "@/components/dashboard/recommended-scholarship-card";
import { ImportantDatesCard } from "@/components/dashboard/important-dates-card";
import { SuggestionsCard } from "@/components/dashboard/suggestions-card";
import { Users, BookOpen, ClipboardList, CheckCircle } from "lucide-react";

// Mock data
const mockSummaryCards = [
  {
    title: "Total disponibles",
    value: "1,204",
    icon: <Users size={24} />,
    highlighted: false,
  },
  {
    title: "Guardadas",
    value: "12",
    icon: <BookOpen size={24} />,
    highlighted: false,
  },
  {
    title: "Aplicaciones activas",
    value: "3",
    icon: <ClipboardList size={24} />,
    highlighted: false,
  },
  {
    title: "Perfil completado",
    value: "85%",
    icon: <CheckCircle size={24} />,
    highlighted: true,
  },
];

// TODO(api): Replace with real data from API
const mockRecommendedScholarships = [
  {
    id: "1",
    name: "Beca Excelencia Académica",
    institution: "Fundación MIT",
    compatibility: 98,
    tags: ["Pregrado", "Ingeniería", "Internacional"],
    closingDate: "15 Noviembre 2024",
    description:
      "Becas para estudiantes de excelencia académica en programas STEM.",
  },
  {
    id: "2",
    name: "Global Education Fund",
    institution: "Global Edu Foundation",
    compatibility: 92,
    tags: ["Posgrado", "Cualquier carrera", "Financiera"],
    closingDate: "28 Noviembre 2024",
    description: "Oportunidad de financiamiento para estudiantes de posgrado.",
  },
  {
    id: "3",
    name: "Beca Liderazgo Social",
    institution: "Fundación Colombia",
    compatibility: 87,
    tags: ["Pregrado", "Liderazgo", "Local"],
    closingDate: "30 Noviembre 2024",
    description: "Para estudiantes comprometidos con impacto social.",
  },
];

// TODO(api): Replace with real data from API
const mockImportantDates = [
  { date: "Mañana", title: "Entrevista Fundación MIT" },
  { date: "15 Noviembre", title: "Cierre Beca Excelencia" },
  { date: "28 Noviembre", title: "Resultados Global Edu" },
];

// TODO(api): Replace with real data from API
const mockSuggestions = [
  { text: "Completa tu perfil para mejorar tus recomendaciones." },
  { text: "Guarda becas para recibir recordatorios automáticos." },
  { text: "Revisa convocatorias con cierre próximo." },
];

export default function DashboardPage() {
  // TODO(auth): Get user from session/context
  const userName = "Eduardo";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#F5F5F5" }}
    >
      {/* Sidebar */}
      <DashboardSidebar currentPath="/dashboard" />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <DashboardTopbar userName={userName} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8">
            {/* Page title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Resumen General
              </h1>
              <p className="mt-2 text-gray-600">
                Bienvenido al portal de becas premium. Aquí encontrarás todas
                las oportunidades personalizadas para ti.
              </p>
            </div>

            {/* Summary cards grid */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {mockSummaryCards.map((card, index) => (
                <SummaryCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  highlighted={card.highlighted}
                />
              ))}
            </div>

            {/* Main content grid - Recommended on left, sidebar on right */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Recommended scholarships - takes 2 cols on desktop */}
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recomendadas para ti
                  </h2>
                  <button
                    className="rounded px-3 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-[#800020] focus:ring-offset-2 focus:outline-none"
                    onClick={() => {
                      // TODO(api): Navigate to all recommendations
                      console.log("Ver todas las recomendaciones");
                    }}
                  >
                    Ver todas →
                  </button>
                </div>

                <div className="space-y-4">
                  {mockRecommendedScholarships.map((scholarship) => (
                    <RecommendedScholarshipCard
                      key={scholarship.id}
                      {...scholarship}
                    />
                  ))}
                </div>
              </div>

              {/* Right sidebar - Dates and Suggestions */}
              <div className="space-y-6">
                {/* Important dates */}
                <ImportantDatesCard events={mockImportantDates} />

                {/* Suggestions */}
                <SuggestionsCard suggestions={mockSuggestions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
