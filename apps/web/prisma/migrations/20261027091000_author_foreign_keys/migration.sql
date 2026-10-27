ALTER TABLE "chamados_manutencao" ALTER COLUMN "abertoPorId" DROP NOT NULL;
ALTER TABLE "solicitacoes_troca_prestador" ALTER COLUMN "solicitanteId" DROP NOT NULL;

UPDATE "atividades_oportunidade" SET "autorId" = NULL WHERE "autorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "atividades_oportunidade"."autorId");
UPDATE "chamados_manutencao" SET "abertoPorId" = NULL WHERE "abertoPorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "chamados_manutencao"."abertoPorId");
UPDATE "chamados_manutencao" SET "concluidoPorId" = NULL WHERE "concluidoPorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "chamados_manutencao"."concluidoPorId");
UPDATE "chamados_manutencao" SET "excluidoPorId" = NULL WHERE "excluidoPorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "chamados_manutencao"."excluidoPorId");
UPDATE "atividades_chamado_manutencao" SET "autorId" = NULL WHERE "autorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "atividades_chamado_manutencao"."autorId");
UPDATE "solicitacoes_troca_prestador" SET "solicitanteId" = NULL WHERE "solicitanteId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "solicitacoes_troca_prestador"."solicitanteId");
UPDATE "solicitacoes_troca_prestador" SET "decididoPorId" = NULL WHERE "decididoPorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "solicitacoes_troca_prestador"."decididoPorId");
UPDATE "prestadores_manutencao" SET "createdById" = NULL WHERE "createdById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "prestadores_manutencao"."createdById");
UPDATE "prestadores_manutencao" SET "updatedById" = NULL WHERE "updatedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "prestadores_manutencao"."updatedById");
UPDATE "atividades_prestador_manutencao" SET "actorUserId" = NULL WHERE "actorUserId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u.id = "atividades_prestador_manutencao"."actorUserId");

CREATE INDEX "atividades_oportunidade_autorId_idx" ON "atividades_oportunidade"("autorId");
CREATE INDEX "chamados_manutencao_abertoPorId_idx" ON "chamados_manutencao"("abertoPorId");
CREATE INDEX "chamados_manutencao_concluidoPorId_idx" ON "chamados_manutencao"("concluidoPorId");
CREATE INDEX "chamados_manutencao_excluidoPorId_idx" ON "chamados_manutencao"("excluidoPorId");
CREATE INDEX "atividades_chamado_manutencao_autorId_idx" ON "atividades_chamado_manutencao"("autorId");
CREATE INDEX "solicitacoes_troca_prestador_solicitanteId_idx" ON "solicitacoes_troca_prestador"("solicitanteId");
CREATE INDEX "solicitacoes_troca_prestador_decididoPorId_idx" ON "solicitacoes_troca_prestador"("decididoPorId");
CREATE INDEX "prestadores_manutencao_createdById_idx" ON "prestadores_manutencao"("createdById");
CREATE INDEX "prestadores_manutencao_updatedById_idx" ON "prestadores_manutencao"("updatedById");
CREATE INDEX "atividades_prestador_manutencao_actorUserId_idx" ON "atividades_prestador_manutencao"("actorUserId");

ALTER TABLE "atividades_oportunidade" ADD CONSTRAINT "atividades_oportunidade_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_abertoPorId_fkey" FOREIGN KEY ("abertoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_concluidoPorId_fkey" FOREIGN KEY ("concluidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "atividades_chamado_manutencao" ADD CONSTRAINT "atividades_chamado_manutencao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_troca_prestador" ADD CONSTRAINT "solicitacoes_troca_prestador_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_troca_prestador" ADD CONSTRAINT "solicitacoes_troca_prestador_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prestadores_manutencao" ADD CONSTRAINT "prestadores_manutencao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prestadores_manutencao" ADD CONSTRAINT "prestadores_manutencao_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "atividades_prestador_manutencao" ADD CONSTRAINT "atividades_prestador_manutencao_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
