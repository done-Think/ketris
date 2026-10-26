-- CreateEnum
CREATE TYPE "CategoriaChamadoManutencao" AS ENUM ('PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'PAINTING', 'OTHER');

-- AlterTable: converte as categorias gravadas em texto (portugues) para o enum. A comparacao
-- ignora maiusculas, acentos e espacos; o que nao corresponder a uma categoria conhecida vira OTHER.
ALTER TABLE "chamados_manutencao"
  ALTER COLUMN "categoria" TYPE "CategoriaChamadoManutencao"
  USING (
    CASE lower(translate(trim("categoria"), 'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc'))
      WHEN 'hidraulica' THEN 'PLUMBING'
      WHEN 'eletrica' THEN 'ELECTRICAL'
      WHEN 'estrutural' THEN 'STRUCTURAL'
      WHEN 'pintura' THEN 'PAINTING'
      ELSE 'OTHER'
    END
  )::"CategoriaChamadoManutencao";

-- Antes das FKs de autor: se algum ID apontar para usuario inexistente, a migration para aqui com a
-- contagem por coluna, para a correcao ser feita a mao (nada e apagado automaticamente).
DO $$
DECLARE
  orphans TEXT;
BEGIN
  SELECT string_agg(label || '=' || total, ', ') INTO orphans
  FROM (
    SELECT 'chamados_manutencao.abertoPorId' AS label, count(*) AS total
      FROM "chamados_manutencao" c WHERE NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = c."abertoPorId")
    UNION ALL
    SELECT 'chamados_manutencao.concluidoPorId', count(*)
      FROM "chamados_manutencao" c WHERE c."concluidoPorId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = c."concluidoPorId")
    UNION ALL
    SELECT 'chamados_manutencao.excluidoPorId', count(*)
      FROM "chamados_manutencao" c WHERE c."excluidoPorId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = c."excluidoPorId")
    UNION ALL
    SELECT 'atividades_chamado_manutencao.autorId', count(*)
      FROM "atividades_chamado_manutencao" a WHERE a."autorId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = a."autorId")
    UNION ALL
    SELECT 'solicitacoes_troca_prestador.solicitanteId', count(*)
      FROM "solicitacoes_troca_prestador" s WHERE NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = s."solicitanteId")
    UNION ALL
    SELECT 'solicitacoes_troca_prestador.decididoPorId', count(*)
      FROM "solicitacoes_troca_prestador" s WHERE s."decididoPorId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = s."decididoPorId")
  ) counts
  WHERE total > 0;

  IF orphans IS NOT NULL THEN
    RAISE EXCEPTION 'IDs de autor sem usuario correspondente: %', orphans;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX "atividades_chamado_manutencao_autorId_idx" ON "atividades_chamado_manutencao"("autorId");

-- CreateIndex
CREATE INDEX "chamados_manutencao_abertoPorId_idx" ON "chamados_manutencao"("abertoPorId");

-- CreateIndex
CREATE INDEX "chamados_manutencao_concluidoPorId_idx" ON "chamados_manutencao"("concluidoPorId");

-- CreateIndex
CREATE INDEX "chamados_manutencao_excluidoPorId_idx" ON "chamados_manutencao"("excluidoPorId");

-- CreateIndex
CREATE INDEX "solicitacoes_troca_prestador_solicitanteId_idx" ON "solicitacoes_troca_prestador"("solicitanteId");

-- CreateIndex
CREATE INDEX "solicitacoes_troca_prestador_decididoPorId_idx" ON "solicitacoes_troca_prestador"("decididoPorId");

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_abertoPorId_fkey" FOREIGN KEY ("abertoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_concluidoPorId_fkey" FOREIGN KEY ("concluidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_chamado_manutencao" ADD CONSTRAINT "atividades_chamado_manutencao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_troca_prestador" ADD CONSTRAINT "solicitacoes_troca_prestador_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_troca_prestador" ADD CONSTRAINT "solicitacoes_troca_prestador_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
