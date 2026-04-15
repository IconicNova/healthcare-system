DROP INDEX IF EXISTS "user_email_key";
DROP INDEX IF EXISTS "staff_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "user_organizationId_email_key"
ON "user"("organizationId", "email");

CREATE UNIQUE INDEX IF NOT EXISTS "staff_organizationId_email_key"
ON "staff"("organizationId", "email");
