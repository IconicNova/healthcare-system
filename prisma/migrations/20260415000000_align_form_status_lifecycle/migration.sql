BEGIN;

ALTER TABLE "client_form" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "FormStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "client_form"
  ALTER COLUMN "status" TYPE "FormStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'PENDING' THEN 'DRAFT'
      WHEN "status"::text = 'COMPLETED' THEN 'SUBMITTED'
      ELSE "status"::text
    END
  )::"FormStatus_new";

DROP TYPE "FormStatus";
ALTER TYPE "FormStatus_new" RENAME TO "FormStatus";

ALTER TABLE "client_form" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

COMMIT;
