import type { ContractListFilters, ContractListResult } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export class ListContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  execute(filters: ContractListFilters): Promise<ContractListResult> {
    return this.contractRepository.findMany(filters)
  }
}
