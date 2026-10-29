import type { ListContractsInput } from '../../types/use-case-inputs'
import { resolveContractReadScope } from '../../domain/contract-access-rules'
import type { ContractListResult } from '../../types/contract-entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export class ListContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute({
    actorTenantId,
    actorId,
    actorRole,
    ...filters
  }: ListContractsInput): Promise<ContractListResult> {
    const scope = resolveContractReadScope(actorTenantId, actorId, actorRole)

    return this.contractRepository.findMany(filters, scope)
  }
}
