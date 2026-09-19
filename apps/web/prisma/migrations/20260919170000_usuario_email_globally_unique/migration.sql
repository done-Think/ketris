-- DropIndex
DROP INDEX "usuarios_tenantId_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
