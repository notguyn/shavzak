-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "recurringGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Assignment_recurringGroupId_idx" ON "Assignment"("recurringGroupId");
