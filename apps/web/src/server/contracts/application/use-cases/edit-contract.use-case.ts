import type { ContractWorkflowRepository } from '../ports/contract-workflow-repository.port'
import type { EditContractInput } from '../../types/workflow'
import { resolveContractManageScope } from '../../domain/contract-access-rules'
import { GuarantorPartyRequiredError } from '../../domain/errors'

export class EditContractUseCase {
  constructor(private readonly repository: ContractWorkflowRepository) {}

  execute(input: EditContractInput) {
    const scope = resolveContractManageScope(input.actorId, input.actorPapel)
    if (
      input.data.guaranteeType === 'FIADOR' &&
      !input.data.parties.some((party) => party.role === 'FIADOR')
    )
      throw new GuarantorPartyRequiredError()
    return this.repository.edit(
      input.contractId,
      { tenantId: input.actorTenantId, actorId: input.actorId, ...scope },
      input.data,
    )
  }
}
