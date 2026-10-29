CREATE TABLE "prestadores_manutencao" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "telefone" TEXT,
  "email" TEXT,
  "observacoes" TEXT,
  "fingerprint" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prestadores_manutencao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "prestadores_manutencao_tenantId_fingerprint_key" ON "prestadores_manutencao"("tenantId", "fingerprint");
CREATE INDEX "prestadores_manutencao_tenantId_ativo_nome_idx" ON "prestadores_manutencao"("tenantId", "ativo", "nome");
ALTER TABLE "prestadores_manutencao" ADD CONSTRAINT "prestadores_manutencao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chamados_manutencao" ADD COLUMN "prestadorId" TEXT;
ALTER TABLE "atividades_chamado_manutencao" ADD COLUMN "systemAction" TEXT;

WITH legacy AS (
  SELECT DISTINCT "tenantId", "prestadorNome", "prestadorTelefone", "prestadorEmail", "prestadorObservacoes",
    encode(sha256(convert_to(array_to_json(ARRAY["prestadorNome", "prestadorTelefone", "prestadorEmail", "prestadorObservacoes"])::text, 'UTF8')), 'hex') AS fingerprint
  FROM "chamados_manutencao" WHERE "prestadorNome" IS NOT NULL AND length("prestadorNome") > 0
)
INSERT INTO "prestadores_manutencao" ("id", "tenantId", "nome", "telefone", "email", "observacoes", "fingerprint", "updatedAt")
SELECT 'legacy-' || md5("tenantId" || fingerprint), "tenantId", "prestadorNome", "prestadorTelefone", "prestadorEmail", "prestadorObservacoes", fingerprint, CURRENT_TIMESTAMP FROM legacy;

UPDATE "chamados_manutencao" c SET "prestadorId" = p.id
FROM "prestadores_manutencao" p
WHERE p."tenantId" = c."tenantId" AND p.fingerprint = encode(sha256(convert_to(array_to_json(ARRAY[c."prestadorNome", c."prestadorTelefone", c."prestadorEmail", c."prestadorObservacoes"])::text, 'UTF8')), 'hex');

CREATE INDEX "chamados_manutencao_prestadorId_idx" ON "chamados_manutencao"("prestadorId");
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "prestadores_manutencao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "atividades_prestador_manutencao" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "prestadorId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorRole" "PapelUsuario" NOT NULL,
  "action" TEXT NOT NULL,
  "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "atividades_prestador_manutencao_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "atividades_prestador_manutencao_tenantId_prestadorId_createdAt_idx" ON "atividades_prestador_manutencao"("tenantId", "prestadorId", "createdAt");
ALTER TABLE "atividades_prestador_manutencao" ADD CONSTRAINT "atividades_prestador_manutencao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "atividades_prestador_manutencao" ADD CONSTRAINT "atividades_prestador_manutencao_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "prestadores_manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "chamados_manutencao" SET categoria = CASE categoria
  WHEN 'Hidráulica' THEN 'PLUMBING'
  WHEN 'Elétrica' THEN 'ELECTRICAL'
  WHEN 'Estrutural' THEN 'STRUCTURAL'
  WHEN 'Pintura' THEN 'PAINTING'
  ELSE categoria END
WHERE categoria IN ('Hidráulica', 'Elétrica', 'Estrutural', 'Pintura');
