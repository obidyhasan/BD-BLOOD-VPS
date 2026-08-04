-- DropIndex
DROP INDEX "donors_profileStatus_idx";

-- AlterTable
ALTER TABLE "BloodRequests" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
