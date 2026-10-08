import { ContractNotFoundError } from '../../domain/errors'
import type { Contract } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export class GetContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: { actorTenantId: string; contractId: string }): Promise<Contract> {
    const contract = await this.contractRepository.findById(input.actorTenantId, input.contractId)

    if (!contract) {
      throw new ContractNotFoundError()
    }

    return contract
  }
}
