-- CreateEnum
CREATE TYPE "AchievementThresholdType" AS ENUM ('VERIFIED_DONATIONS', 'TOTAL_DONATIONS');

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "thresholdType" "AchievementThresholdType" NOT NULL,
    "thresholdValue" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_achievements" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donor_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "achievements_active_idx" ON "achievements"("active");

-- CreateIndex
CREATE INDEX "achievements_thresholdType_idx" ON "achievements"("thresholdType");

-- CreateIndex
CREATE INDEX "donor_achievements_donorId_idx" ON "donor_achievements"("donorId");

-- CreateIndex
CREATE INDEX "donor_achievements_achievementId_idx" ON "donor_achievements"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "donor_achievements_donorId_achievementId_key" ON "donor_achievements"("donorId", "achievementId");

-- AddForeignKey
ALTER TABLE "donor_achievements" ADD CONSTRAINT "donor_achievements_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_achievements" ADD CONSTRAINT "donor_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
