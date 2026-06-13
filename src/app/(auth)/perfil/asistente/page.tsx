"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { coverageLabels, academicLevelLabels } from "@/lib/becas/format";
import type {
  ChatMessage,
  ProfileDraft,
} from "@/validators/profile-assistant.validator";

const PROFILE_STORAGE_KEY = "becahub_profile_draft";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "¡Hola! Soy tu asistente para encontrar becas. Para empezar, cuéntame: ¿qué estás estudiando actualmente o qué te gustaría estudiar?",
  },
];

export default function AsistentePerfilPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function sendMessage() {
    if (!input.trim() || sending) return;

    const next = [
      ...messages,
      { role: "user", content: input.trim() } as ChatMessage,
    ];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/perfil/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "No se pudo contactar al asistente");
        return;
      }

      setMessages([...next, { role: "assistant", content: json.reply }]);
      if (json.profileReady && json.profile) {
        setProfile(json.profile as ProfileDraft);
      }
    } catch {
      setError(
        "No se pudo conectar con el asistente. Puedes llenar tu perfil manualmente más adelante.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleSaveLocal() {
    if (!profile) return;
    // Guardado interino: sin autenticación real todavía, el perfil se
    // guarda en localStorage. TODO: cuando exista sesión, llamar a
    // `POST /api/perfil` con el userId real.
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSaveMessage("Perfil guardado en este dispositivo.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Asistente de perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "assistant"
                    ? "bg-muted rounded-lg p-3 text-sm"
                    : "bg-primary/10 rounded-lg p-3 text-sm"
                }
              >
                <span className="text-muted-foreground mb-1 block text-xs font-medium">
                  {m.role === "assistant" ? "Asistente" : "Tú"}
                </span>
                {m.content}
              </div>
            ))}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Escribe tu respuesta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={sending || !input.trim()}>
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Tu perfil propuesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ProfileField
              label="Nivel académico"
              value={
                profile.academicLevel
                  ? academicLevelLabels[
                      profile.academicLevel as keyof typeof academicLevelLabels
                    ]
                  : null
              }
            />
            <ProfileField
              label="Área de interés"
              value={profile.fieldOfInterest}
            />
            <ProfileField
              label="País de origen"
              value={profile.countryOrigin}
            />
            <ProfileField
              label="País de interés"
              value={profile.countryInterest}
            />
            <ProfileField
              label="Tipos de beca"
              value={
                profile.scholarshipTypes.length > 0
                  ? profile.scholarshipTypes
                      .map(
                        (t) => coverageLabels[t as keyof typeof coverageLabels],
                      )
                      .join(", ")
                  : null
              }
            />
            <ProfileField label="Idioma" value={profile.language} />
            <ProfileField label="Situación" value={profile.situation} />
            <ProfileField label="Metas" value={profile.goals} />

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveLocal}>Guardar perfil</Button>
              {saveMessage && (
                <span className="text-muted-foreground text-xs">
                  {saveMessage}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}
