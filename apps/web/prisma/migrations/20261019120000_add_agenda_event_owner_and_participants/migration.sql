-- DTK-147: dono explícito (donoUsuarioId) e participantes (eventos_agenda_participantes) do
-- evento de agenda, usados para autorizar a leitura do RENTER.
-- Migração apenas aditiva: os eventos existentes ficam sem dono e sem participantes.
-- Não há backfill: participanteNome/participanteTelefone não identificam um usuário com
-- segurança, então os vínculos antigos só podem ser criados explicitamente pela equipe.

-- AlterTable
ALTER TABLE "eventos_agenda" ADD COLUMN     "donoUsuarioId" TEXT;

-- CreateTable
CREATE TABLE "eventos_agenda_participantes" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_agenda_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_agenda_participantes_usuarioId_idx" ON "eventos_agenda_participantes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_agenda_participantes_eventoId_usuarioId_key" ON "eventos_agenda_participantes"("eventoId", "usuarioId");

-- CreateIndex
CREATE INDEX "eventos_agenda_donoUsuarioId_idx" ON "eventos_agenda"("donoUsuarioId");

-- AddForeignKey
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_donoUsuarioId_fkey" FOREIGN KEY ("donoUsuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agenda_participantes" ADD CONSTRAINT "eventos_agenda_participantes_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos_agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agenda_participantes" ADD CONSTRAINT "eventos_agenda_participantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

