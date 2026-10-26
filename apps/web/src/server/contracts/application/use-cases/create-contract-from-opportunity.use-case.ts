import type { CreateContractFromOpportunityInput } from '../../types/use-case-inputs'
import { resolveContractManageScope } from '../../domain/contract-access-rules'
import {
  GuarantorPartyRequiredError,
  OpportunityAlreadyHasContractError,
  OpportunityNotAcceptedError,
  OpportunityNotFoundError,
} from '../../domain/errors'
import type { Contract } from '../../domain/contract.entity'
import type { NewContractParty } from '../../types/contract-entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export class CreateContractFromOpportunityUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: CreateContractFromOpportunityInput): Promise<Contract> {
    const scope = resolveContractManageScope(input.actorId, input.actorPapel)

    if (input.guaranteeType === 'FIADOR' && !input.guarantor) {
      throw new GuarantorPartyRequiredError()
    }

    const opportunity = await this.contractRepository.findEligibleOpportunity(
      input.actorTenantId,
      input.opportunityId,
      scope,
    )

    if (!opportunity) {
      throw new OpportunityNotFoundError()
    }

    if (opportunity.hasContract) {
      throw new OpportunityAlreadyHasContractError()
    }

    if (opportunity.status !== 'ACEITA') {
      throw new OpportunityNotAcceptedError()
    }

    const parties: NewContractParty[] = [
      { ...input.owner, role: 'LOCADOR' },
      { ...input.tenant, role: 'LOCATARIO' },
    ]

    if (input.guarantor) {
      parties.push({ ...input.guarantor, role: 'FIADOR' })
    }

    return this.contractRepository.create(
      {
        tenantId: input.actorTenantId,
        actorId: input.actorId,
        opportunityId: input.opportunityId,
        amount: input.amount,
        type: input.type,
        dueDay: input.dueDay,
        startDate: input.startDate,
        endDate: input.endDate,
        adjustmentIndex: input.adjustmentIndex,
        guaranteeType: input.guaranteeType,
        notes: input.notes,
        parties,
      },
      scope,
    )
  }
}
