CREATE TYPE "DestinoEventoAgenda" AS ENUM ('LEGACY_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT');

ALTER TABLE "eventos_agenda"
    ADD COLUMN "destino" "DestinoEventoAgenda" NOT NULL DEFAULT 'LEGACY_TEAM',
    ADD COLUMN "interno" BOOLEAN NOT NULL DEFAULT false;
