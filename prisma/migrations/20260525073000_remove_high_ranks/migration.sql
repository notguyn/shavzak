-- Remove BRIGADIER_GENERAL, MAJOR_GENERAL, CHIEF_OF_STAFF from Rank enum

-- Rename existing type so we can create the new one
ALTER TYPE "Rank" RENAME TO "Rank_old";

-- Create new Rank without the removed values
CREATE TYPE "Rank" AS ENUM (
  'PRIVATE',
  'CORPORAL',
  'SERGEANT',
  'STAFF_SERGEANT',
  'SERGEANT_FIRST_CLASS',
  'MASTER_SERGEANT',
  'STAFF_SERGEANT_MAJOR',
  'SENIOR_SERGEANT_MAJOR',
  'RAV_NAGAD',
  'SECOND_LIEUTENANT',
  'LIEUTENANT',
  'CAPTAIN',
  'MAJOR',
  'LIEUTENANT_COLONEL',
  'COLONEL'
);

ALTER TABLE "Soldier" ALTER COLUMN "rank" DROP DEFAULT;
ALTER TABLE "Soldier" ALTER COLUMN "rank" TYPE "Rank" USING "rank"::text::"Rank";
ALTER TABLE "Soldier" ALTER COLUMN "rank" SET DEFAULT 'PRIVATE'::"Rank";

DROP TYPE "Rank_old";
