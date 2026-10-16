import type { Papel } from '@server/auth/domain/user.entity'

import { resolveContractAccessScope } from '../../domain/contract-access-rules'
import type { ContractListFilters, ContractListResult } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export interface ListContractsInput extends ContractListFilters {
  actorId: string
  actorPapel: Papel
}

export class ListContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute({
    actorId,
    actorPapel,
    ...filters
  }: ListContractsInput): Promise<ContractListResult> {
    const scope = resolveContractAccessScope(actorId, actorPapel)

    return this.contractRepository.findMany(filters, scope)
  }
}
