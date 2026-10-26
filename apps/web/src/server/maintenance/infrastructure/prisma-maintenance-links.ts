import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { assertAdmin } from '../application/authorization'
import type { MaintenanceActor, MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import type { MaintenanceContractPartyLink } from '../types/prisma-maintenance-ticket-repository'
import { activityData, contractInclude } from './maintenance-ticket-mapper'

export async function regularizeMaintenanceLinks(
  actor: MaintenanceActor,
  input: MaintenanceUserLinkInput,
  linkParty: MaintenanceContractPartyLink,
) {
  assertAdmin(actor)
  for (let attempt = 1; ; attempt++) {
    try {
      return await regularizeOnce(actor, input, linkParty)
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') {
        throw error
      }
      if (attempt >= 3) {
        throw new ConflictError('O vínculo foi alterado. Revise os dados e tente novamente.')
      }
    }
  }
}

async function regularizeOnce(
  actor: MaintenanceActor,
  input: MaintenanceUserLinkInput,
  linkParty: MaintenanceContractPartyLink,
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
        await linkParty(tx, actor, {
          contractId: contract.id,
          partyId: input.partyId,
          renterId: input.renterId,
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
            systemAction: 'LINKS_REGULARIZED',
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
