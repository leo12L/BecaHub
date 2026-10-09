import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User as PrismaUser } from "@/generated/prisma/client";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required",
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: unknown }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        } catch {
          // Called from Server Component, can't modify cookies
        }
      },
    },
  });
}

/**
 * Obtiene el usuario autenticado desde Supabase Auth y sincroniza con Prisma.
 * Retorna null si no hay sesión activa.
 * 
 * Maneja colisión de emails con usuarios legacy de NextAuth:
 * - Si existe un usuario con el mismo email pero diferente ID, lo actualiza con el ID de Supabase
 * - Si no existe, crea uno nuevo con el ID de Supabase
 */
export async function getCurrentUser(): Promise<PrismaUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Buscar primero por ID (usuario ya migrado)
  let user = await db.user.findUnique({ where: { id: authUser.id } });

  if (user) {
    // Usuario ya existe con el ID correcto, solo actualizamos metadata
    user = await db.user.update({
      where: { id: authUser.id },
      data: {
        email: authUser.email!,
        name: authUser.user_metadata.name || null,
        image: authUser.user_metadata.avatar_url || null,
        emailVerified: authUser.email_confirmed_at
          ? new Date(authUser.email_confirmed_at)
          : null,
        updatedAt: new Date(),
      },
    });
    return user;
  }

  // Usuario no existe con este ID, buscar por email (posible legacy de NextAuth)
  const legacyUser = await db.user.findUnique({
    where: { email: authUser.email! },
  });

  if (legacyUser) {
    // Encontramos un usuario legacy con este email pero diferente ID
    // Lo migramos actualizando su ID al de Supabase Auth
    // Primero eliminamos el legacy (cascade eliminará relaciones)
    await db.user.delete({ where: { id: legacyUser.id } });
    
    // Ahora creamos con el ID correcto de Supabase
    user = await db.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata.name || legacyUser.name || null,
        image: authUser.user_metadata.avatar_url || legacyUser.image || null,
        emailVerified: authUser.email_confirmed_at
          ? new Date(authUser.email_confirmed_at)
          : legacyUser.emailVerified,
        role: legacyUser.role, // Preservar el rol existente
      },
    });
    return user;
  }

  // Usuario completamente nuevo
  user = await db.user.create({
    data: {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata.name || null,
      image: authUser.user_metadata.avatar_url || null,
      emailVerified: authUser.email_confirmed_at
        ? new Date(authUser.email_confirmed_at)
        : null,
      role: "USER",
    },
  });

  return user;
}

/**
 * Requiere que el usuario esté autenticado. Lanza error 401 si no lo está.
 */
export async function requireUser(): Promise<PrismaUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Requiere que el usuario tenga uno de los roles especificados.
 * Lanza error 403 si no tiene el rol requerido.
 */
export async function requireRole(
  ...roles: PrismaUser["role"][]
): Promise<PrismaUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
