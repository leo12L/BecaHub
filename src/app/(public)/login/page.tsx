"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Error al crear la cuenta");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "register"
            ? "Cuenta creada, pero hubo un error al iniciar sesión. Inténtalo de nuevo."
            : "Email o contraseña incorrectos.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#800020]">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">BecaHub</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Mode tabs */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "border-b-2 border-[#800020] text-[#800020]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "border-b-2 border-[#800020] text-[#800020]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            {mode === "register" && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Nombre (opcional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Contraseña {mode === "register" && <span className="font-normal text-slate-400">(mín. 6 caracteres)</span>}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6a001a] disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === "login" ? "Entrar" : "Crear cuenta e ingresar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-700 underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
