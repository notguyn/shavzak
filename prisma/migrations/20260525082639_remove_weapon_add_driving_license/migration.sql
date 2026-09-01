/*
  Warnings:

  - You are about to drop the column `vehicleLicenses` on the `Soldier` table. All the data in the column will be lost.
  - You are about to drop the column `weaponQualification` on the `Soldier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Soldier" DROP COLUMN "vehicleLicenses",
DROP COLUMN "weaponQualification",
ADD COLUMN     "hasDrivingLicense" BOOLEAN NOT NULL DEFAULT false;
