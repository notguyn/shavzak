-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BATTALION_CMD', 'PLATOON_CMD', 'VIEWER');

-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('PRIVATE', 'CORPORAL', 'SERGEANT', 'STAFF_SERGEANT', 'SERGEANT_FIRST_CLASS', 'LIEUTENANT', 'CAPTAIN', 'MAJOR');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('MISSION', 'GUARD', 'SHIFT', 'TRANSPORT', 'STANDBY', 'ATTENDANCE', 'TASK');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BoardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BoardScope" AS ENUM ('BATTALION', 'PLATOON');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('EMPTY', 'FILLED', 'LOCKED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "ConstraintKind" AS ENUM ('HARD', 'SOFT');

-- CreateTable
CREATE TABLE "Platoon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commanderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platoon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soldier" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "personalNumber" TEXT NOT NULL,
    "rank" "Rank" NOT NULL DEFAULT 'PRIVATE',
    "platoonId" TEXT,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "homeCity" TEXT,
    "travelDistanceKm" INTEGER NOT NULL DEFAULT 0,
    "weaponQualification" TEXT,
    "vehicleLicenses" TEXT[],
    "medicalLimitations" TEXT[],
    "availability" JSONB,
    "preferredShifts" TEXT[],
    "blockedShifts" TEXT[],
    "maxConsecutiveDuties" INTEGER NOT NULL DEFAULT 3,
    "lastAssignmentDate" TIMESTAMP(3),
    "reserveHistory" JSONB,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Soldier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShavzakBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "BoardScope" NOT NULL DEFAULT 'BATTALION',
    "platoonId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BoardStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShavzakBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssignmentType" NOT NULL DEFAULT 'MISSION',
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "requiredManpower" INTEGER NOT NULL DEFAULT 1,
    "requiredRole" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "requiresWeapon" BOOLEAN NOT NULL DEFAULT false,
    "requiresVehicle" BOOLEAN NOT NULL DEFAULT false,
    "recurring" JSONB,
    "difficultyScore" INTEGER NOT NULL DEFAULT 1,
    "boardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSlot" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "soldierId" TEXT,
    "status" "SlotStatus" NOT NULL DEFAULT 'EMPTY',
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstraintRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" "ConstraintKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "params" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstraintRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "platoonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SoldierCertifications" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SoldierCertifications_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssignmentCertifications" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignmentCertifications_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Platoon_commanderId_key" ON "Platoon"("commanderId");

-- CreateIndex
CREATE UNIQUE INDEX "Soldier_personalNumber_key" ON "Soldier"("personalNumber");

-- CreateIndex
CREATE INDEX "Soldier_platoonId_idx" ON "Soldier"("platoonId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_code_key" ON "Certification"("code");

-- CreateIndex
CREATE INDEX "Assignment_boardId_idx" ON "Assignment"("boardId");

-- CreateIndex
CREATE INDEX "Assignment_startAt_idx" ON "Assignment"("startAt");

-- CreateIndex
CREATE INDEX "AssignmentSlot_assignmentId_idx" ON "AssignmentSlot"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentSlot_boardId_idx" ON "AssignmentSlot"("boardId");

-- CreateIndex
CREATE INDEX "AssignmentSlot_soldierId_idx" ON "AssignmentSlot"("soldierId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstraintRule_key_key" ON "ConstraintRule"("key");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_SoldierCertifications_B_index" ON "_SoldierCertifications"("B");

-- CreateIndex
CREATE INDEX "_AssignmentCertifications_B_index" ON "_AssignmentCertifications"("B");

-- AddForeignKey
ALTER TABLE "Platoon" ADD CONSTRAINT "Platoon_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "Soldier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soldier" ADD CONSTRAINT "Soldier_platoonId_fkey" FOREIGN KEY ("platoonId") REFERENCES "Platoon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShavzakBoard" ADD CONSTRAINT "ShavzakBoard_platoonId_fkey" FOREIGN KEY ("platoonId") REFERENCES "Platoon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ShavzakBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSlot" ADD CONSTRAINT "AssignmentSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSlot" ADD CONSTRAINT "AssignmentSlot_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ShavzakBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSlot" ADD CONSTRAINT "AssignmentSlot_soldierId_fkey" FOREIGN KEY ("soldierId") REFERENCES "Soldier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_platoonId_fkey" FOREIGN KEY ("platoonId") REFERENCES "Platoon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SoldierCertifications" ADD CONSTRAINT "_SoldierCertifications_A_fkey" FOREIGN KEY ("A") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SoldierCertifications" ADD CONSTRAINT "_SoldierCertifications_B_fkey" FOREIGN KEY ("B") REFERENCES "Soldier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignmentCertifications" ADD CONSTRAINT "_AssignmentCertifications_A_fkey" FOREIGN KEY ("A") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignmentCertifications" ADD CONSTRAINT "_AssignmentCertifications_B_fkey" FOREIGN KEY ("B") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
