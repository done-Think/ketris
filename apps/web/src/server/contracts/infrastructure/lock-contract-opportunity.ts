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
  await tx.$queryRaw`SELECT id FROM opportunities WHERE id = ${input.opportunityId} AND "tenantId" = ${input.tenantId} FOR NO KEY UPDATE`
  const candidate = await tx.opportunity.findFirst({
    where: { id: input.opportunityId, tenantId: input.tenantId, ...opportunityScopeWhere(scope) },
    select: { propertyId: true },
  })
  if (!candidate) throw new OpportunityNotFoundError()
  await tx.$queryRaw`SELECT id FROM properties WHERE id = ${candidate.propertyId} AND "tenantId" = ${input.tenantId} FOR NO KEY UPDATE`
  const opportunity = await tx.opportunity.findFirst({
    where: { id: input.opportunityId, tenantId: input.tenantId, ...opportunityScopeWhere(scope) },
    select: {
      propertyId: true,
      proposedValue: true,
      status: true,
      contract: { select: { id: true } },
    },
  })
  if (!opportunity) throw new OpportunityNotFoundError()
  if (opportunity.contract) throw new OpportunityAlreadyHasContractError()
  if (opportunity.status !== 'ACCEPTED') throw new OpportunityNotAcceptedError()
  return opportunity
}
