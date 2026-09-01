-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Rank" ADD VALUE 'STAFF_SERGEANT_MAJOR';
ALTER TYPE "Rank" ADD VALUE 'SENIOR_SERGEANT_MAJOR';
ALTER TYPE "Rank" ADD VALUE 'MASTER_SERGEANT';
ALTER TYPE "Rank" ADD VALUE 'SECOND_LIEUTENANT';
ALTER TYPE "Rank" ADD VALUE 'LIEUTENANT_COLONEL';
