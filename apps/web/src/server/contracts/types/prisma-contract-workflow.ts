import type { Prisma } from '@prisma/client'
import type { ContractWithRelations } from './prisma-contract-repository'

export type ContractWorkflowWork<T> = (
  tx: Prisma.TransactionClient,
  contract: ContractWithRelations,
) => Promise<T>
