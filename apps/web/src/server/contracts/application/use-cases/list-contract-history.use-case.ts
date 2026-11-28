import { resolveContractReadScope } from '../../domain/contract-access-rules'
import { ContractNotFoundError } from '../../domain/errors'
import type { ListContractHistoryInput } from '../../types/workflow'
import type { ContractWorkflowRepository } from '../ports/contract-workflow-repository.port'

export class ListContractHistoryUseCase {
  constructor(private readonly repository: ContractWorkflowRepository) {}

  execute(input: ListContractHistoryInput) {
    if (input.actorRole === 'RENTER') throw new ContractNotFoundError()
    const scope = resolveContractReadScope(input.actorTenantId, input.actorId, input.actorRole)
    return this.repository.history(input.contractId, scope, input.page, input.pageSize)
  }
}
