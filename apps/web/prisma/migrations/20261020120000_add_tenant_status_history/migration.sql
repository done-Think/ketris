-- Histórico de mudanças de situação dos tenants, base do churn mensal (review do PR #123).
-- Só de inclusão: reativar um tenant cancelado registra uma nova linha em vez de apagar o
-- cancelamento, então o churn de um mês já fechado não muda retroativamente.

-- CreateTable
CREATE TABLE "tenant_status_changes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromStatus" "TenantStatus" NOT NULL,
    "toStatus" "TenantStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT,

    CONSTRAINT "tenant_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_status_changes_tenantId_changedAt_idx" ON "tenant_status_changes"("tenantId", "changedAt");

-- CreateIndex
CREATE INDEX "tenant_status_changes_changedById_idx" ON "tenant_status_changes"("changedById");

-- AddForeignKey
ALTER TABLE "tenant_status_changes" ADD CONSTRAINT "tenant_status_changes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_status_changes" ADD CONSTRAINT "tenant_status_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: tenants já cancelados ganham a única mudança comprovável, o cancelamento em
-- canceledAt. A situação anterior nunca foi registrada; assume-se ACTIVE. Cancelamentos que já
-- foram desfeitos por reativação antes desta migration não deixaram rastro e não são recriados.
INSERT INTO "tenant_status_changes" ("id", "tenantId", "fromStatus", "toStatus", "changedAt")
SELECT gen_random_uuid()::text, "id", 'ACTIVE', 'CANCELED', "canceledAt"
FROM "tenants"
WHERE "status" = 'CANCELED' AND "canceledAt" IS NOT NULL;
