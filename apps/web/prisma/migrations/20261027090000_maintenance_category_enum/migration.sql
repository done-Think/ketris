CREATE TYPE "CategoriaChamadoManutencao" AS ENUM ('PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'PAINTING', 'OTHER');

UPDATE "chamados_manutencao" SET categoria = CASE categoria
  WHEN 'Hidráulica' THEN 'PLUMBING'
  WHEN 'Elétrica' THEN 'ELECTRICAL'
  WHEN 'Estrutural' THEN 'STRUCTURAL'
  WHEN 'Pintura' THEN 'PAINTING'
  WHEN 'PLUMBING' THEN 'PLUMBING'
  WHEN 'ELECTRICAL' THEN 'ELECTRICAL'
  WHEN 'STRUCTURAL' THEN 'STRUCTURAL'
  WHEN 'PAINTING' THEN 'PAINTING'
  ELSE 'OTHER' END;

ALTER TABLE "chamados_manutencao"
  ALTER COLUMN "categoria" TYPE "CategoriaChamadoManutencao" USING ("categoria"::"CategoriaChamadoManutencao");

ALTER INDEX "atividades_prestador_manutencao_tenantId_prestadorId_createdAt_" RENAME TO "atividades_prestador_manutencao_tenantId_prestadorId_create_idx";
