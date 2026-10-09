-- AlterEnum: Add MODERATOR to Role enum
-- IMPORTANTE: ALTER TYPE ... ADD VALUE no puede correr en transacción
-- Por eso este archivo NO tiene el pragma de transacción

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MODERATOR';
