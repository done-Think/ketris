import type { Papel } from '@server/auth/domain/user.entity'

import type { ChargeListFilters, ChargeListResult } from '../../domain/charge.entity'
import { assertCanReadCharges } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface ListChargesInput extends Omit<ChargeListFilters, 'renterId'> {
  actorId: string
  actorPapel: Papel
}

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute({ actorId, actorPapel, ...filters }: ListChargesInput): Promise<ChargeListResult> {
    assertCanReadCharges(actorPapel)

    return this.chargeRepository.findMany({
      ...filters,
      ...(actorPapel === 'RENTER' ? { renterId: actorId, type: 'A_RECEBER' as const } : {}),
    })
  }
}
