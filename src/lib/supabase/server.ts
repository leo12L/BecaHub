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
 * - SOLO vincula si el email está confirmado (email_confirmed_at)
 * - Cambia el ID del usuario legacy al ID de Supabase Auth en una transacción
 * - Preserva favoritos, perfil y postulaciones gracias a onUpdate: Cascade
 * - Si el email no está confirmado, no toca al usuario legacy y lanza error
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
    // SEGURIDAD: Solo vincular si el email está confirmado
    if (!authUser.email_confirmed_at) {
      throw new Error(
        "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
      );
    }

    // Vincular el usuario legacy actualizando su ID en una transacción
    // Las FKs con onUpdate: Cascade preservan favoritos, perfil y postulaciones
    user = await db.$transaction(async (tx) => {
      return tx.user.update({
        where: { email: authUser.email! },
        data: {
          id: authUser.id,
          name: authUser.user_metadata.name || legacyUser.name || null,
          image: authUser.user_metadata.avatar_url || legacyUser.image || null,
          emailVerified: new Date(authUser.email_confirmed_at!),
          updatedAt: new Date(),
          // role se preserva del usuario legacy (no se hereda sin confirmación)
        },
      });
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
