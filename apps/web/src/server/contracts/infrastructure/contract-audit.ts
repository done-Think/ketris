import type { Prisma } from '@prisma/client'
import type { ContractAuditInput } from '../types/audit'

export function recordContractAudit(tx: Prisma.TransactionClient, input: ContractAuditInput) {
  return tx.contractAuditEvent.create({ data: input })
}
