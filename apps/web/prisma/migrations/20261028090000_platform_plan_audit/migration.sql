-- AlterTable
ALTER TABLE "platform_plans" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedById" TEXT,
ADD COLUMN     "updatedByName" TEXT;

-- CreateTable
CREATE TABLE "platform_plan_changes" (
    "id" TEXT NOT NULL,
    "accountType" "TenantAccountType" NOT NULL,
    "previousMonthlyPrice" DECIMAL(12,2) NOT NULL,
    "previousIncludedUnits" INTEGER NOT NULL,
    "previousExtraUnitPrice" DECIMAL(12,2) NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "includedUnits" INTEGER NOT NULL,
    "extraUnitPrice" DECIMAL(12,2) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT,
    "changedByName" TEXT NOT NULL,

    CONSTRAINT "platform_plan_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_plan_changes_accountType_changedAt_idx" ON "platform_plan_changes"("accountType", "changedAt");

-- CreateIndex
CREATE INDEX "platform_plan_changes_changedById_idx" ON "platform_plan_changes"("changedById");

-- CreateIndex
CREATE INDEX "platform_plans_updatedById_idx" ON "platform_plans"("updatedById");

-- AddForeignKey
ALTER TABLE "platform_plans" ADD CONSTRAINT "platform_plans_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_plan_changes" ADD CONSTRAINT "platform_plan_changes_accountType_fkey" FOREIGN KEY ("accountType") REFERENCES "platform_plans"("accountType") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_plan_changes" ADD CONSTRAINT "platform_plan_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill
UPDATE "platform_plans" SET "createdAt" = "updatedAt";
