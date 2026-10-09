-- AddOnUpdateCascade
-- Agregar onUpdate: Cascade a todas las FKs de userId para permitir
-- vincular usuarios legacy de NextAuth con nuevos IDs de Supabase Auth

-- Favorite.userId
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Application.userId
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification.userId
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Profile.userId
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
