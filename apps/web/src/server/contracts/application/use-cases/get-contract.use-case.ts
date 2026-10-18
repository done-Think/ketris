import type { Papel } from '@server/auth/domain/user.entity'

import { resolveContractAccessScope } from '../../domain/contract-access-rules'
import { ContractNotFoundError } from '../../domain/errors'
import type { Contract } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export interface GetContractInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contractId: string
}

export class GetContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: GetContractInput): Promise<Contract> {
    const scope = resolveContractAccessScope(input.actorId, input.actorPapel)
    const contract = await this.contractRepository.findById(
      input.actorTenantId,
      input.contractId,
      scope,
    )

    if (!contract) {
      throw new ContractNotFoundError()
    }

    return contract
  }
}
