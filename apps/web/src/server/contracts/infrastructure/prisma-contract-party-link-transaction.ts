import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { ContractPartyLinkTransaction } from '../application/ports/contract-party-link-transaction.port'
import type {
  ContractPartyLinkDependencies,
  ContractPartyLinkWork,
} from '../types/contract-party-link-transaction'
import { linkContractPartyUser } from './contract-party-user-link'
import { recordContractAudit } from './contract-audit'

export class PrismaContractPartyLinkTransaction implements ContractPartyLinkTransaction {
  constructor(private readonly transaction?: Prisma.TransactionClient) {}

  run<T>(work: ContractPartyLinkWork<T>): Promise<T> {
    if (this.transaction) return work(this.dependencies(this.transaction))
    return prisma.$transaction((tx) => work(this.dependencies(tx)))
  }

  private dependencies(tx: Prisma.TransactionClient): ContractPartyLinkDependencies {
    const userSelect = { id: true, tenantId: true, email: true, papel: true, ativo: true } as const
    return {
      users: {
        findManyByEmail: (email) =>
          tx.usuario.findMany({ where: { email: normalizeEmail(email) }, select: userSelect }),
        findById: (id) => tx.usuario.findUnique({ where: { id }, select: userSelect }),
      },
      contracts: {
        findById: async (id, scope) => {
          await tx.$queryRaw`SELECT id FROM "contratos" WHERE id = ${id} AND "tenantId" = ${scope.tenantId} FOR UPDATE`
          const contract = await tx.contrato.findFirst({
            where: { id, tenantId: scope.tenantId },
            select: {
              id: true,
              partes: { select: { id: true, papel: true, email: true, usuarioId: true } },
            },
          })
          return contract
            ? {
                id: contract.id,
                parties: contract.partes.map((party) => ({
                  id: party.id,
                  role: party.papel,
                  email: party.email,
                  userId: party.usuarioId,
                })),
              }
            : null
        },
        linkPartyUser: async (input) => {
          const linked = await linkContractPartyUser(tx, input)
          if (linked)
            await recordContractAudit(tx, {
              tenantId: input.tenantId,
              contractId: input.contractId,
              actorUserId: input.actorId,
              action: 'UPDATED',
              changedFields: ['parties.userId'],
            })
          return linked
        },
      },
    }
  }
}
