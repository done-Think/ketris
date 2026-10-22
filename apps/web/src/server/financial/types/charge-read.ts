import type { Papel } from '@server/auth/domain/user.entity'

import type { ChargeListFilters } from '../domain/charge.entity'

export interface ChargeReadActor {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
}

export type ListChargesInput = ChargeReadActor & Omit<ChargeListFilters, 'scope'>

export type GetChargeInput = ChargeReadActor & { chargeId: string }

export interface GetFinancialSummaryInput {
  actorTenantId: string
  actorPapel: Papel
}
