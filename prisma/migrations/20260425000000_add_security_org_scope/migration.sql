ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "notification" n
SET "organizationId" = u."organizationId"
FROM "user" u
WHERE n."userId" = u."id" AND n."organizationId" IS NULL;
ALTER TABLE "notification" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "notification"
  ADD CONSTRAINT "notification_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "notification_organizationId_userId_createdAt_idx"
  ON "notification" ("organizationId", "userId", "createdAt");

ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "audit_log" a
SET "organizationId" = u."organizationId"
FROM "user" u
WHERE a."userId" = u."id" AND a."organizationId" IS NULL;
ALTER TABLE "audit_log" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "audit_log_organizationId_entity_entityId_createdAt_idx"
  ON "audit_log" ("organizationId", "entity", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_log_organizationId_userId_createdAt_idx"
  ON "audit_log" ("organizationId", "userId", "createdAt");

ALTER TABLE "med_administration" ADD COLUMN IF NOT EXISTS "safetyChecks" JSONB;
