import type { Papel } from '@server/auth/domain/user.entity'

import { resolveContractReadScope } from '../../domain/contract-access-rules'
import type { ContractListFilters, ContractListResult } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export interface ListContractsInput extends ContractListFilters {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}

export class ListContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute({
    actorTenantId,
    actorId,
    actorPapel,
    ...filters
  }: ListContractsInput): Promise<ContractListResult> {
    const scope = resolveContractReadScope(actorTenantId, actorId, actorPapel)

    return this.contractRepository.findMany(filters, scope)
  }
}
