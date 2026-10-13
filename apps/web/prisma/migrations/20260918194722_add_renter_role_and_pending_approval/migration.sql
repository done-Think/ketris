-- AlterEnum
ALTER TYPE "PapelUsuario" ADD VALUE 'RENTER';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "vinculoAprovadoEm" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
