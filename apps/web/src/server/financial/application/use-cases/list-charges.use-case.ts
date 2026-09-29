import type { ChargeListFilters, ChargeListResult } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  execute(filters: ChargeListFilters): Promise<ChargeListResult> {
    return this.chargeRepository.findMany(filters)
  }
}
