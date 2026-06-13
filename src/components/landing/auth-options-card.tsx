/**
 * Auth Options Card Component
 * Sign in options: Google, GitHub, and email.
 */

"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function AuthOptionsCard() {
  const [email, setEmail] = useState("");

  const handleGoogleClick = () => {
    // TODO(auth): Conectar con Google OAuth
    console.log("Google OAuth");
  };

  const handleGithubClick = () => {
    // TODO(auth): Conectar con GitHub OAuth
    console.log("GitHub OAuth");
  };

  const handleEmailClick = () => {
    // TODO(auth): Conectar con email/magic link
    console.log("Email magic link:", email);
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-[#E8E8E8] bg-white p-8">
      {/* Header */}
      <h2 className="mb-2 text-center text-xl font-semibold text-[#1A1A1A]">
        Accede a tu espacio personal
      </h2>
      <p className="mb-6 text-center text-sm text-[#6B7280]">
        Guarda becas, recibe alertas y consulta recomendaciones según tu perfil.
      </p>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        className="mb-3 flex w-full items-center justify-center gap-3 rounded-md border border-[#E8E8E8] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors duration-150 hover:bg-[#F5F5F5]"
      >
        {/* Google Logo SVG */}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuar con Google
      </button>

      {/* GitHub Button */}
      <button
        type="button"
        onClick={handleGithubClick}
        className="mb-5 flex w-full items-center justify-center gap-3 rounded-md border border-[#E8E8E8] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors duration-150 hover:bg-[#F5F5F5]"
      >
        {/* GitHub Logo SVG */}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Continuar con GitHub
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E8E8E8]"></div>
        <span className="text-xs text-[#6B7280]">o con correo</span>
        <div className="h-px flex-1 bg-[#E8E8E8]"></div>
      </div>

      {/* Email Input */}
      <input
        type="email"
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-3 w-full rounded-md border border-[#E8E8E8] px-3 py-2.5 text-sm transition-colors duration-150 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 focus:outline-none"
        aria-label="Email address"
      />

      {/* Email Button */}
      <button
        type="button"
        onClick={handleEmailClick}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#800020] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#6a001a]"
      >
        <Mail size={18} />
        Continuar con correo
      </button>

      {/* Sign up link */}
      <p className="mt-4 text-center text-xs text-[#6B7280]">
        ¿No tienes cuenta?{" "}
        <button
          onClick={() => {
            // TODO(auth): Conectar con flujo de registro
            console.log("Registrarse");
          }}
          className="font-medium text-[#800020] hover:underline"
        >
          Regístrate
        </button>
      </p>

      {/* Coming soon note */}
      <p className="mt-3 text-center text-xs text-[#6B7280]/60">
        La autenticación estará disponible próximamente.
      </p>
    </div>
  );
}
