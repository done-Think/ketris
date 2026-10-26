import type { MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import type { MaintenanceContractPartyLinkerFactory } from '../types/prisma-maintenance-ticket-repository'
import { contractInclude, activityData } from './maintenance-ticket-mapper'

// Admin-only (checked by the use case). Runs serializable so concurrent regularizations of the same
// contract cannot interleave; the contract-party link itself is delegated to contracts.
export async function regularizeMaintenanceLinks(
  actor: MaintenanceActor,
  input: MaintenanceUserLinkInput,
  contractPartyLinker: MaintenanceContractPartyLinkerFactory,
) {
  // Serializable transactions can abort with a false conflict (P2034) under unrelated concurrent
  // load; only a failure that survives every attempt is reported as a real conflict.
  for (let attempt = 1; ; attempt++) {
    try {
      return await regularizeOnce(actor, input, contractPartyLinker)
    } catch (error) {
      const serializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
      if (!serializationFailure) throw error
      if (attempt >= SERIALIZATION_ATTEMPTS)
        throw new ConflictError('O vínculo foi alterado. Revise os dados e tente novamente.')
    }
  }
}

const SERIALIZATION_ATTEMPTS = 3

async function regularizeOnce(
  actor: MaintenanceActor,
  input: MaintenanceUserLinkInput,
  contractPartyLinker: MaintenanceContractPartyLinkerFactory,
) {
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "contratos" WHERE id = ${input.contractId} AND "tenantId" = ${actor.actorTenantId} FOR UPDATE`
      const contract = await tx.contrato.findFirst({
        where: {
          id: input.contractId,
          tenantId: actor.actorTenantId,
          imovel: { tenantId: actor.actorTenantId },
        },
        include: contractInclude,
      })
      if (!contract) throw new ForbiddenError()
      if (input.ownerId) {
        const user = await tx.usuario.findFirst({
          where: {
            id: input.ownerId,
            tenantId: actor.actorTenantId,
            papel: 'PROPERTY_OWNER',
            ativo: true,
          },
        })
        if (!user) throw new ForbiddenError('Proprietario invalido.')
        await tx.imovel.update({
          where: { id: contract.imovelId },
          data: { proprietarioId: user.id },
        })
      }
      if (input.renterId && input.partyId) {
        await contractPartyLinker(tx).execute({
          actorTenantId: actor.actorTenantId,
          actorId: actor.actorId,
          actorPapel: actor.actorPapel,
          contractId: contract.id,
          partyId: input.partyId,
          userId: input.renterId,
        })
      }
      const tickets = await tx.chamadoManutencao.findMany({
        where: { tenantId: actor.actorTenantId, imovelId: contract.imovelId },
        select: { id: true, updatedAt: true },
      })
      for (const ticket of tickets) {
        await tx.chamadoManutencao.update({
          where: { id: ticket.id },
          data: { updatedAt: new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1)) },
        })
        await tx.atividadeChamadoManutencao.create({
          data: activityData(ticket.id, {
            type: 'EDICAO',
            message: 'Vinculos de acesso regularizados pelo administrador.',
            authorId: actor.actorId,
            authorName: actor.actorName,
            details: {
              contractId: contract.id,
              before: {
                ownerId: contract.imovel.proprietarioId,
                parties: contract.partes.map((p) => ({ id: p.id, userId: p.usuarioId })),
              },
              after: input,
            },
          }),
        })
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}
