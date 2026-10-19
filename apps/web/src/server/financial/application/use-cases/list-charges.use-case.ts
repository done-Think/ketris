import type { ChargeListFilters, ChargeListResult } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type { Papel } from '@server/auth/domain/user.entity'

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  execute(
    input: Omit<ChargeListFilters, 'renterId'> & { actorId: string; actorPapel: Papel },
  ): Promise<ChargeListResult> {
    const { actorId, actorPapel, ...filters } = input
    return this.chargeRepository.findMany({
      ...filters,
      ...(actorPapel === 'RENTER' ? { renterId: actorId, type: 'A_RECEBER' as const } : {}),
    })
  }
}
