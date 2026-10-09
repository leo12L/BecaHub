"use client";

// TODO: Migrar a Supabase Auth en fase posterior
// Este componente usa NextAuth que fue eliminado en Fase 1

export default function LoginPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-muted-foreground">
        La autenticación con NextAuth fue reemplazada por Supabase Auth.
        Por favor, use <a href="/admin/login" className="underline">/admin/login</a> para acceder al panel de administración.
      </p>
    </div>
  );
}
