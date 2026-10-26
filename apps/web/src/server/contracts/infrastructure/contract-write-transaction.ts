import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ContractNotFoundError } from '../domain/errors'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractWorkflowScope } from '../types/workflow'
import type { ContractWorkflowWork } from '../types/prisma-contract-workflow'
import { contractInclude } from './contract-query'
import { toDomainContract } from './prisma-contract.mapper'

export function runManagedContractMutation<T>(
  contractId: string,
  scope: ContractWorkflowScope,
  work: ContractWorkflowWork<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "contratos" WHERE id = ${contractId} AND "tenantId" = ${scope.tenantId} FOR NO KEY UPDATE`
    const where = {
      id: contractId,
      tenantId: scope.tenantId,
      imovel: {
        tenantId: scope.tenantId,
        ...(scope.responsibleId ? { responsavelId: scope.responsibleId } : {}),
      },
    }
    const candidate = await tx.contrato.findFirst({ where, select: { imovelId: true } })
    if (!candidate) throw new ContractNotFoundError()
    await tx.$queryRaw`SELECT id FROM "imoveis" WHERE id = ${candidate.imovelId} AND "tenantId" = ${scope.tenantId} FOR NO KEY UPDATE`
    const contract = await tx.contrato.findFirst({ where, include: contractInclude })
    if (!contract) throw new ContractNotFoundError()
    return work(tx, contract)
  })
}

export async function readContractAfterWrite(
  tx: Prisma.TransactionClient,
  contractId: string,
  tenantId: string,
  protector: ContractDataProtector,
) {
  const row = await tx.contrato.findFirst({
    where: { id: contractId, tenantId },
    include: contractInclude,
  })
  if (!row) throw new ContractNotFoundError()
  return toDomainContract(row, protector)
}
