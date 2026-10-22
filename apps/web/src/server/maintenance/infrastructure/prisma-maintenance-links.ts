import type { MaintenanceUserLinkInput } from '../types/maintenance-ticket'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import {
  assertContractRenterLink,
  assertRenterParty,
} from '@server/contracts/domain/contract-renter-link-policy'
import { linkContractPartyUser } from '@server/contracts/infrastructure/contract-party-user-link'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import { assertAdmin } from '../application/authorization'
import { contractInclude, activityData } from './maintenance-ticket-mapper'

export async function regularizeMaintenanceLinks(
  actor: MaintenanceActor,
  input: MaintenanceUserLinkInput,
) {
  assertAdmin(actor)
  await prisma
    .$transaction(
      async (tx) => {
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
              papel: 'OWNER',
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
          const row = contract.partes.find((p) => p.id === input.partyId)
          const party = row && { role: row.papel, email: row.email, userId: row.usuarioId }
          assertRenterParty(party)
          const user = await tx.usuario.findFirst({
            where: {
              id: input.renterId,
            },
          })
          assertContractRenterLink(party, user)
          const linked = await linkContractPartyUser(tx, {
            tenantId: actor.actorTenantId,
            contractId: contract.id,
            partyId: input.partyId,
            userId: user.id,
            email: normalizeEmail(user.email),
          })
          if (!linked)
            throw new ConflictError(
              'A parte do contrato foi alterada. Revise o vínculo e tente novamente.',
            )
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
    .catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictError('O vínculo foi alterado. Revise os dados e tente novamente.')
      }
      throw error
    })
}
