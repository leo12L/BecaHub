-- RemoveNextAuthTables
-- Remove NextAuth v4 tables as part of migration to Supabase Auth
-- User.id is now the Supabase Auth user id (comes from auth.users)
-- Account, Session, and VerificationToken are no longer needed

-- Remove foreign keys first
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

-- Remove password field from User (Supabase Auth handles passwords)
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";

-- Change User.id to not use default uuid() since it will come from Supabase Auth
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
