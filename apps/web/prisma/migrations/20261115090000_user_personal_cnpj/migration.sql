-- A broker may identify with a CPF or with the CNPJ of their own company; the CNPJ is unique inside a tenant, like the CPF.
ALTER TABLE "users" ADD COLUMN "cnpj" TEXT;
CREATE UNIQUE INDEX "users_tenantId_cnpj_key" ON "users"("tenantId", "cnpj");
