import type { Prisma } from '@prisma/client'
import type { ContratoWithRelations } from './prisma-contract-repository'

export type ContractWorkflowWork<T> = (
  tx: Prisma.TransactionClient,
  contract: ContratoWithRelations,
) => Promise<T>
