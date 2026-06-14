"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles, ExternalLink, RefreshCw } from "lucide-react";

interface BecaRecomendada {
  id: string;
  slug: string;
  title: string;
  description: string;
  country: string;
  applyUrl: string;
  isVerified: boolean;
  deadline: string;
  amount: string | null;
}

const PROFILE_KEY = "becahub_profile_draft";

export function PersonalizedRecommendations() {
  const { data: session } = useSession();
  const [items, setItems]     = useState<BecaRecomendada[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      // 1. Try DB profile if logged in
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/perfil/me");
          const json = await res.json();
          if (json.profile) {
            setHasProfile(true);
            fetchRecommendations(json.profile);
            return;
          }
        } catch {
          // Fall through to localStorage
        }
      }

      // 2. Fall back to localStorage
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return;
      let profile: Record<string, unknown>;
      try { profile = JSON.parse(raw); }
      catch { return; }
      setHasProfile(true);
      fetchRecommendations(profile);
    }

    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function fetchRecommendations(profile: Record<string, unknown>) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (profile.academicLevel) params.set("academicLevel", String(profile.academicLevel));
      if (profile.countryInterest) params.set("countryInterest", String(profile.countryInterest));
      if (Array.isArray(profile.scholarshipTypes) && profile.scholarshipTypes.length > 0) {
        params.set("scholarshipTypes", profile.scholarshipTypes.join(","));
      }
      if (profile.language) params.set("language", String(profile.language));

      const res  = await fetch(`/api/recomendaciones?${params}`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setItems(json.data);
    } catch {
      // silently ignore — not critical
    } finally {
      setLoading(false);
    }
  }

  if (!hasProfile) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-[#800020]" />
        <h2 className="text-lg font-bold text-slate-800">Para ti</h2>
        <span className="rounded-full bg-[#800020]/10 px-2 py-0.5 text-xs font-semibold text-[#800020]">
          Basado en tu perfil
        </span>
        {loading && (
          <RefreshCw size={14} className="ml-auto animate-spin text-slate-400" />
        )}
      </div>

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No encontramos becas que coincidan exactamente con tu perfil actual.{" "}
          <Link href="/becas" className="text-[#800020] underline">
            Explora el catálogo completo
          </Link>{" "}
          o{" "}
          <Link href="/perfil/asistente" className="text-[#800020] underline">
            actualiza tu perfil
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((beca) => (
            <article
              key={beca.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 text-sm font-bold text-slate-800">
                  <Link
                    href={`/becas/${beca.slug}`}
                    className="hover:text-[#800020] focus-visible:underline focus-visible:outline-none"
                  >
                    {beca.title}
                  </Link>
                </h3>
                {beca.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                    {beca.description}
                  </p>
                )}
                <div className="mt-auto space-y-1 text-xs text-slate-500">
                  <p>📍 <span className="font-semibold text-slate-700">{beca.country}</span></p>
                  {beca.amount && <p className="font-bold text-slate-800">{beca.amount}</p>}
                  <p>⏰ {beca.deadline}</p>
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                <Link
                  href={`/becas/${beca.slug}`}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver más
                </Link>
                <a
                  href={beca.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#800020] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6a001a]"
                >
                  Postular <ExternalLink size={11} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
