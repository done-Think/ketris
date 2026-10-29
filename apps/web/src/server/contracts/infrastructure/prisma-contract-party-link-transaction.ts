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
    const userSelect = { id: true, tenantId: true, email: true, role: true, active: true } as const
    return {
      users: {
        findManyByEmail: (email) =>
          tx.user.findMany({ where: { email: normalizeEmail(email) }, select: userSelect }),
        findById: (id) => tx.user.findUnique({ where: { id }, select: userSelect }),
      },
      contracts: {
        findById: async (id, scope) => {
          await tx.$queryRaw`SELECT id FROM "contracts" WHERE id = ${id} AND "tenantId" = ${scope.tenantId} FOR UPDATE`
          const contract = await tx.contract.findFirst({
            where: { id, tenantId: scope.tenantId },
            select: {
              id: true,
              parties: { select: { id: true, role: true, email: true, userId: true } },
            },
          })
          return contract
            ? {
                id: contract.id,
                parties: contract.parties.map((party) => ({
                  id: party.id,
                  role: party.role,
                  email: party.email,
                  userId: party.userId,
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
