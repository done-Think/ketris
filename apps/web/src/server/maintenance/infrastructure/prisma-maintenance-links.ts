import { isTransactionWriteConflict } from '@server/db/transaction-errors'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { assertAdmin } from '../application/authorization'
import type { MaintenanceActor, MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import type { MaintenanceContractPartyLink } from '../types/prisma-maintenance-ticket-repository'
import { activityData, contractInclude } from './maintenance-ticket-mapper'
import { maintenanceMutationAuthor } from './maintenance-mutation-author'

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
      if (!isTransactionWriteConflict(error)) {
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
      await tx.$queryRaw`SELECT id FROM "contracts" WHERE id = ${input.contractId} AND "tenantId" = ${actor.actorTenantId} FOR UPDATE`
      const contract = await tx.contract.findFirst({
        where: {
          id: input.contractId,
          tenantId: actor.actorTenantId,
          property: { tenantId: actor.actorTenantId },
        },
        include: contractInclude,
      })
      if (!contract) throw new ForbiddenError()
      const authorId = await maintenanceMutationAuthor(
        tx,
        { tenantId: contract.tenantId, contractId: contract.id },
        actor.actorId,
      )
      if (input.ownerId) {
        const user = await tx.user.findFirst({
          where: {
            id: input.ownerId,
            tenantId: actor.actorTenantId,
            role: 'PROPERTY_OWNER',
            active: true,
          },
        })
        if (!user) throw new ForbiddenError('Proprietario invalido.')
        await tx.property.update({
          where: { id: contract.propertyId, tenantId: contract.tenantId },
          data: { ownerId: user.id, updatedById: authorId },
        })
      }
      if (input.renterId && input.partyId) {
        await linkParty(tx, actor, {
          contractId: contract.id,
          partyId: input.partyId,
          renterId: input.renterId,
        })
      }
      const tickets = await tx.maintenanceTicket.findMany({
        where: { tenantId: actor.actorTenantId, propertyId: contract.propertyId },
        select: { id: true, updatedAt: true },
      })
      for (const ticket of tickets) {
        await tx.maintenanceTicket.update({
          where: { id: ticket.id, tenantId: actor.actorTenantId },
          data: {
            updatedById: authorId,
            updatedAt: new Date(Math.max(Date.now(), ticket.updatedAt.getTime() + 1)),
          },
        })
        await tx.maintenanceTicketActivity.create({
          data: activityData(ticket.id, {
            type: 'EDIT',
            systemAction: 'LINKS_REGULARIZED',
            message: 'Vinculos de acesso regularizados pelo administrador.',
            authorId: actor.actorId,
            authorName: actor.actorName,
            details: {
              contractId: contract.id,
              before: {
                ownerId: contract.property.ownerId,
                parties: contract.parties.map((p) => ({ id: p.id, userId: p.userId })),
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
