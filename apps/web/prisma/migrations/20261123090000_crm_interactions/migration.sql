BEGIN;
ALTER TABLE "leads" ADD COLUMN "lastContactAt" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "contactId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "leads_id_tenantId_key" ON "leads"("id", "tenantId");
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "contacts"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;
CREATE INDEX "leads_tenantId_contactId_idx" ON "leads"("tenantId", "contactId");
UPDATE "leads" l SET "contactId" = o."contactId" FROM "opportunities" o JOIN "contacts" c ON c.id = o."contactId" AND c."tenantId" = o."tenantId" WHERE l."opportunityId" = o.id AND l."tenantId" = o."tenantId" AND o."contactId" IS NOT NULL;
CREATE TYPE "CrmInteractionChannel" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP');
CREATE TYPE "CrmInteractionStatus" AS ENUM ('STARTED', 'CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED');
CREATE TYPE "CrmInteractionKind" AS ENUM ('CONTACT_ATTEMPT', 'STAGE_CHANGED', 'CONTACT_LINKED', 'LEAD_CREATED');
CREATE TABLE "crm_interactions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "leadId" TEXT,
  "contactId" TEXT,
  "requestId" TEXT NOT NULL,
  "kind" "CrmInteractionKind" NOT NULL DEFAULT 'CONTACT_ATTEMPT',
  "channel" "CrmInteractionChannel",
  "status" "CrmInteractionStatus" DEFAULT 'STARTED',
  "previousStage" "LeadStage",
  "nextStage" "LeadStage",
  "description" TEXT,
  "actorUserId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "completedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "crm_interactions_leadId_tenantId_fkey" FOREIGN KEY ("leadId", "tenantId") REFERENCES "leads"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "crm_interactions_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "contacts"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "crm_interactions_parent_check" CHECK (num_nonnulls("leadId", "contactId") = 1),
  CONSTRAINT "crm_interactions_kind_check" CHECK (("kind" = 'CONTACT_ATTEMPT' AND "channel" IS NOT NULL AND "status" IS NOT NULL) OR ("kind" <> 'CONTACT_ATTEMPT' AND "leadId" IS NOT NULL AND "channel" IS NULL AND "status" IS NULL)),
  CONSTRAINT "crm_interactions_stage_check" CHECK ("kind" <> 'STAGE_CHANGED' OR ("previousStage" IS NOT NULL AND "nextStage" IS NOT NULL))
);
CREATE UNIQUE INDEX "crm_interactions_tenantId_requestId_key" ON "crm_interactions"("tenantId", "requestId");
CREATE INDEX "crm_interactions_tenantId_leadId_createdAt_id_idx" ON "crm_interactions"("tenantId", "leadId", "createdAt", "id");
CREATE INDEX "crm_interactions_tenantId_contactId_createdAt_id_idx" ON "crm_interactions"("tenantId", "contactId", "createdAt", "id");
COMMIT;
