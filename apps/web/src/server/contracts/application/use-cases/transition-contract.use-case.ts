import { AppError } from '@server/shared/errors'
import { resolveContractManageScope } from '../../domain/contract-access-rules'
import type { TransitionContractInput } from '../../types/workflow'
import type { ContractWorkflowRepository } from '../ports/contract-workflow-repository.port'

export class TransitionContractUseCase {
  constructor(private readonly repository: ContractWorkflowRepository) {}

  execute(input: TransitionContractInput) {
    const scope = resolveContractManageScope(input.actorId, input.actorPapel)
    const reason = input.reason.trim()
    if (!reason || reason.length > 10000)
      throw new AppError('Informe um motivo com até 10.000 caracteres.', {
        status: 400,
        code: 'CONTRACT_REASON_REQUIRED',
      })
    return this.repository.transition(
      input.contractId,
      { tenantId: input.actorTenantId, actorId: input.actorId, ...scope },
      { action: input.action, reason },
    )
  }
}
