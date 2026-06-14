"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bot,
  Send,
  User2,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { coverageLabels, academicLevelLabels } from "@/lib/becas/format";
import type {
  ChatMessage,
  ProfileDraft,
} from "@/validators/profile-assistant.validator";

const PROFILE_KEY = "becahub_profile_draft";

const INITIAL: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "¡Hola! Soy tu asistente para encontrar becas. Estoy aquí para ayudarte a identificar qué documentos necesitas, mejorar tu perfil académico y encontrar las mejores oportunidades.\n\nPara empezar, cuéntame: ¿qué estás estudiando actualmente o qué te gustaría estudiar?",
  },
];

export default function AsistentePage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/perfil/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al contactar al asistente");
        return;
      }
      setMessages([...next, { role: "assistant", content: json.reply }]);
      if (json.profileReady && json.profile)
        setProfile(json.profile as ProfileDraft);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo en un momento.");
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    // If logged in, also persist to DB
    if (session?.user?.id) {
      try {
        await fetch("/api/perfil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
      } catch {
        // localStorage is the fallback; DB save failure is non-critical
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function restart() {
    setMessages(INITIAL);
    setInput("");
    setProfile(null);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="bg-background flex flex-1 flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="border-border bg-card flex shrink-0 items-center gap-3 border-b px-6 py-4 shadow-sm">
        <div className="bg-primary flex size-9 items-center justify-center rounded-full">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-foreground text-sm font-bold">
            Asistente BecaHub
          </h1>
          <p className="text-muted-foreground text-xs">
            Ayuda con documentación, perfil y becas
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          title="Nueva conversación"
          className="border-border text-muted-foreground hover:bg-secondary hover:text-primary ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <RefreshCw size={13} />
          Nueva
        </button>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-1 gap-6 overflow-hidden p-4 md:p-6">
        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
                    m.role === "assistant" ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Bot size={14} className="text-white" />
                  ) : (
                    <User2 size={14} className="text-highlight" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "assistant"
                      ? "border-border bg-card text-foreground rounded-tl-sm border"
                      : "bg-primary rounded-tr-sm text-white"
                  }`}
                >
                  {m.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < m.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="border-border bg-card rounded-2xl rounded-tl-sm border px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="text-primary animate-spin" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="mt-4 flex gap-3">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escribe tu mensaje… (Enter para enviar)"
              disabled={loading}
              className="border-border text-foreground focus:border-primary focus:ring-primary flex-1 resize-none rounded-xl border bg-white px-4 py-3 text-sm placeholder:text-[#6F8A82] focus:ring-1 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary/90 flex size-12 shrink-0 items-center justify-center self-end rounded-xl text-white shadow-sm transition-all disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* ── Profile panel (shown once ready) ── */}
        {profile && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto md:block">
            <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-sm font-bold">Tu perfil</h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                  <CheckCircle2 size={11} />
                  Listo
                </span>
              </div>

              <div className="space-y-3">
                <ProfileRow
                  label="Nivel"
                  value={
                    profile.academicLevel
                      ? academicLevelLabels[
                          profile.academicLevel as keyof typeof academicLevelLabels
                        ]
                      : null
                  }
                />
                <ProfileRow label="Área" value={profile.fieldOfInterest} />
                <ProfileRow label="País origen" value={profile.countryOrigin} />
                <ProfileRow
                  label="País interés"
                  value={profile.countryInterest}
                />
                <ProfileRow label="Idioma" value={profile.language} />
                <ProfileRow
                  label="Tipos"
                  value={
                    profile.scholarshipTypes?.length
                      ? profile.scholarshipTypes
                          .map(
                            (t) =>
                              coverageLabels[t as keyof typeof coverageLabels],
                          )
                          .join(", ")
                      : null
                  }
                />
                {profile.situation && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">
                      Situación
                    </p>
                    <p className="text-foreground text-xs leading-relaxed">
                      {profile.situation}
                    </p>
                  </div>
                )}
                {profile.goals && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">
                      Metas
                    </p>
                    <p className="text-foreground text-xs leading-relaxed">
                      {profile.goals}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={saveProfile}
                className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  saved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {saved ? "✓ Guardado" : "Guardar perfil"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
        {label}
      </p>
      <p className="text-foreground text-xs font-semibold">{value}</p>
    </div>
  );
}
