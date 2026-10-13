-- CreateEnum
CREATE TYPE "StatusEventoAgenda" AS ENUM ('CONFIRMED', 'PENDING', 'RESCHEDULE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TipoEventoAgenda" AS ENUM ('VISIT', 'FOLLOW_UP', 'MEETING', 'INSPECTION', 'SIGNATURE', 'OTHER');

-- CreateTable
CREATE TABLE "eventos_agenda" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "imovelId" TEXT,
    "referenciaImovelLivre" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEventoAgenda",
    "status" "StatusEventoAgenda" NOT NULL DEFAULT 'CONFIRMED',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "participanteNome" TEXT NOT NULL,
    "participanteTelefone" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_agenda_tenantId_idx" ON "eventos_agenda"("tenantId");

-- CreateIndex
CREATE INDEX "eventos_agenda_tenantId_inicio_idx" ON "eventos_agenda"("tenantId", "inicio");

-- CreateIndex
CREATE INDEX "eventos_agenda_responsavelId_idx" ON "eventos_agenda"("responsavelId");

-- CreateIndex
CREATE INDEX "eventos_agenda_imovelId_idx" ON "eventos_agenda"("imovelId");

-- AddForeignKey
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
