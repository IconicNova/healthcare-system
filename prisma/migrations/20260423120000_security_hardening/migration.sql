-- Harden money storage to fixed-precision decimals
ALTER TABLE "staff"
  ALTER COLUMN "hourlyRate" TYPE DECIMAL(10, 2) USING ROUND("hourlyRate"::numeric, 2);

ALTER TABLE "service"
  ALTER COLUMN "baseRate" TYPE DECIMAL(10, 2) USING ROUND("baseRate"::numeric, 2);

ALTER TABLE "invoice"
  ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "invoice_item"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(10, 2) USING ROUND("unitPrice"::numeric, 2),
  ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "payment"
  ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "insurance_claim"
  ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING ROUND("amount"::numeric, 2),
  ALTER COLUMN "approvedAmount" TYPE DECIMAL(10, 2) USING ROUND("approvedAmount"::numeric, 2);

-- Strengthen audit logging ownership and queryability
ALTER TABLE "audit_log" DROP CONSTRAINT IF EXISTS "audit_log_userId_fkey";

ALTER TABLE "audit_log"
  ADD COLUMN "organizationId" TEXT,
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "changes" TYPE JSONB USING CASE
    WHEN "changes" IS NULL THEN NULL
    ELSE to_jsonb("changes")
  END;

UPDATE "audit_log" AS al
SET "organizationId" = u."organizationId"
FROM "user" AS u
WHERE al."userId" = u.id
  AND al."organizationId" IS NULL;

ALTER TABLE "audit_log"
  ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "audit_log_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");
