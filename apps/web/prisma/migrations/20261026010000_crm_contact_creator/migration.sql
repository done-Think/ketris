ALTER TABLE "contatos" ADD COLUMN "createdById" TEXT;
CREATE INDEX "contatos_tenantId_createdById_idx" ON "contatos"("tenantId", "createdById");
