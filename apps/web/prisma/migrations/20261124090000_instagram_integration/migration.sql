-- CreateEnum
CREATE TYPE "InstagramPublicationStatus" AS ENUM ('QUEUED', 'PREPARING', 'READY', 'PUBLISHING', 'VERIFYING', 'PUBLISHED', 'FAILED', 'BLOCKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "instagram_connections" (
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "oauthUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revision" TEXT NOT NULL,
    "connectedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("tenantId", "connectedBy")
);

-- CreateTable
CREATE TABLE "instagram_oauth_states" (
    "hash" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "verifierHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_oauth_states_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "instagram_publications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "oauthUserId" TEXT NOT NULL,
    "connectionRevision" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "preparedKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "InstagramPublicationStatus" NOT NULL DEFAULT 'QUEUED',
    "containerId" TEXT,
    "mediaId" TEXT,
    "permalink" TEXT,
    "lastErrorCode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "leaseToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_connections_accountId_key" ON "instagram_connections"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_connections_oauthUserId_key" ON "instagram_connections"("oauthUserId");

-- CreateIndex
CREATE INDEX "instagram_oauth_states_expiresAt_idx" ON "instagram_oauth_states"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_publications_dedupeKey_key" ON "instagram_publications"("dedupeKey");

-- CreateIndex
CREATE INDEX "instagram_publications_tenantId_requestedBy_propertyId_idx" ON "instagram_publications"("tenantId", "requestedBy", "propertyId");

-- CreateIndex
CREATE INDEX "instagram_publications_oauthUserId_idx" ON "instagram_publications"("oauthUserId");

-- CreateIndex
CREATE INDEX "instagram_publications_status_nextAttemptAt_idx" ON "instagram_publications"("status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_publications" ADD CONSTRAINT "instagram_publications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

