import type { GetContractInput } from '../../types/use-case-inputs'
import { resolveContractReadScope } from '../../domain/contract-access-rules'
import { ContractNotFoundError } from '../../domain/errors'
import type { Contract } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export class GetContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: GetContractInput): Promise<Contract> {
    const scope = resolveContractReadScope(input.actorTenantId, input.actorId, input.actorPapel)
    const contract = await this.contractRepository.findById(input.contractId, scope)

    if (!contract) {
      throw new ContractNotFoundError()
    }

    return contract
  }
}
