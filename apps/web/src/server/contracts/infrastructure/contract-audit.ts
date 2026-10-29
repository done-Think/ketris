import type { Prisma } from '@prisma/client'
import type { ContractAuditInput } from '../types/audit'

export async function recordContractAudit(tx: Prisma.TransactionClient, input: ContractAuditInput) {
  // Update metadata in the same transaction without changing the business timestamp.
  const authorId = input.actorType === 'SYSTEM' ? null : (input.actorUserId ?? null)
  await tx.$executeRaw`UPDATE contracts SET "updatedById" = ${authorId} WHERE id = ${input.contractId} AND "tenantId" = ${input.tenantId}`
  return tx.contractAuditEvent.create({ data: input })
}
