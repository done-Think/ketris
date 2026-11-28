-- CreateTable
CREATE TABLE "favorite_properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_properties_tenantId_userId_createdAt_idx" ON "favorite_properties"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "favorite_properties_propertyId_idx" ON "favorite_properties"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_properties_userId_propertyId_key" ON "favorite_properties"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "favorite_properties" ADD CONSTRAINT "favorite_properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_properties" ADD CONSTRAINT "favorite_properties_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_properties" ADD CONSTRAINT "favorite_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
