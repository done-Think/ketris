import type { Papel } from '@server/auth/domain/user.entity'

import type { ChargeListFilters, ChargeListResult } from '../../domain/charge.entity'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface ListChargesInput extends ChargeListFilters {
  actorPapel: Papel
}

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute({ actorPapel, ...filters }: ListChargesInput): Promise<ChargeListResult> {
    assertCanAccessFinance(actorPapel)

    return this.chargeRepository.findMany(filters)
  }
}
