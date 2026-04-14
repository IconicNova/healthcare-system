BEGIN;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "visitId", "templateId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
    ) AS rn
  FROM "client_form"
  WHERE "visitId" IS NOT NULL
)
DELETE FROM "client_form"
WHERE id IN (
  SELECT id
  FROM duplicates
  WHERE rn > 1
);

ALTER TABLE "client_form"
  ADD CONSTRAINT "client_form_visitId_templateId_key" UNIQUE ("visitId", "templateId");

COMMIT;
