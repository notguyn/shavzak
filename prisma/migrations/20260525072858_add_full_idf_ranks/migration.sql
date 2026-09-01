-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Rank" ADD VALUE 'RAV_NAGAD';
ALTER TYPE "Rank" ADD VALUE 'COLONEL';
ALTER TYPE "Rank" ADD VALUE 'BRIGADIER_GENERAL';
ALTER TYPE "Rank" ADD VALUE 'MAJOR_GENERAL';
ALTER TYPE "Rank" ADD VALUE 'CHIEF_OF_STAFF';
