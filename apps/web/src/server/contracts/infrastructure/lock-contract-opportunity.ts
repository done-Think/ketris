import type { Prisma } from '@prisma/client'
import type { ContractManageScope, NewContract } from '../types/contract-entity'
import {
  OpportunityAlreadyHasContractError,
  OpportunityNotAcceptedError,
  OpportunityNotFoundError,
} from '../domain/errors'
import { opportunityScopeWhere } from './contract-query'

export async function lockContractOpportunity(
  tx: Prisma.TransactionClient,
  input: NewContract,
  scope: ContractManageScope,
) {
  await tx.$queryRaw`SELECT id FROM oportunidades WHERE id = ${input.opportunityId} AND "tenantId" = ${input.tenantId} FOR NO KEY UPDATE`
  const candidate = await tx.oportunidade.findFirst({
    where: { id: input.opportunityId, tenantId: input.tenantId, ...opportunityScopeWhere(scope) },
    select: { imovelId: true },
  })
  if (!candidate) throw new OpportunityNotFoundError()
  await tx.$queryRaw`SELECT id FROM imoveis WHERE id = ${candidate.imovelId} AND "tenantId" = ${input.tenantId} FOR NO KEY UPDATE`
  const opportunity = await tx.oportunidade.findFirst({
    where: { id: input.opportunityId, tenantId: input.tenantId, ...opportunityScopeWhere(scope) },
    select: {
      imovelId: true,
      valorProposto: true,
      status: true,
      contrato: { select: { id: true } },
    },
  })
  if (!opportunity) throw new OpportunityNotFoundError()
  if (opportunity.contrato) throw new OpportunityAlreadyHasContractError()
  if (opportunity.status !== 'ACEITA') throw new OpportunityNotAcceptedError()
  return opportunity
}
