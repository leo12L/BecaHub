import { z } from "zod";
import { saveProfileSchema } from "./profile-assistant.validator";

/**
 * Body de `POST /api/perfil`.
 *
 * TODO: una vez que exista autenticación real (NextAuth), `userId` debe
 * tomarse de la sesión del request en vez de venir en el body. Mientras
 * tanto este es el mecanismo interino: el cliente guarda el perfil en
 * `localStorage` y lo asocia a un usuario existente vía este campo.
 */
export const savePerfilSchema = z.object({
  userId: z.string().uuid(),
  profile: saveProfileSchema,
});

export type SavePerfilBody = z.infer<typeof savePerfilSchema>;
