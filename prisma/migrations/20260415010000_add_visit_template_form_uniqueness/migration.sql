BEGIN;

CREATE TABLE IF NOT EXISTS "client_form_duplicate_archive" AS
SELECT cf.*, CURRENT_TIMESTAMP AS "archivedAt"
FROM "client_form" cf
WHERE false
WITH NO DATA;

ALTER TABLE "client_form_duplicate_archive"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "visitId", "templateId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
    ) AS rn
  FROM "client_form"
  WHERE "visitId" IS NOT NULL
),
archived_duplicates AS (
  SELECT cf.*
  FROM "client_form" cf
  INNER JOIN duplicates d ON d.id = cf.id
  WHERE d.rn > 1
)
INSERT INTO "client_form_duplicate_archive" (
  id,
  "templateId",
  "visitId",
  "clientId",
  "formData",
  status,
  "submittedAt",
  "submittedBy",
  "approvedAt",
  "approvedBy",
  "rejectedAt",
  "rejectionReason",
  "createdAt",
  "updatedAt"
)
SELECT
  id,
  "templateId",
  "visitId",
  "clientId",
  "formData",
  status,
  "submittedAt",
  "submittedBy",
  "approvedAt",
  "approvedBy",
  "rejectedAt",
  "rejectionReason",
  "createdAt",
  "updatedAt"
FROM archived_duplicates;

DELETE FROM "client_form"
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "visitId", "templateId"
        ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
      ) AS rn
    FROM "client_form"
    WHERE "visitId" IS NOT NULL
  ) duplicates
  WHERE rn > 1
);

ALTER TABLE "client_form"
  ADD CONSTRAINT "client_form_visitId_templateId_key" UNIQUE ("visitId", "templateId");

COMMIT;
