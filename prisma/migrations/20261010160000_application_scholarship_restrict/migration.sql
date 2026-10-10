-- Application.scholarshipId: Restrict. Borrar una beca no puede
-- arrastrar postulaciones. Application.userId sigue en Cascade (LFPDPPP).
-- Favorite.scholarshipId se queda en Cascade.

ALTER TABLE "Application" DROP CONSTRAINT "Application_scholarshipId_fkey";

ALTER TABLE "Application" ADD CONSTRAINT "Application_scholarshipId_fkey"
  FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
