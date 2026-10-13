import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import {
  GuarantorPartyRequiredError,
  OpportunityAlreadyHasContractError,
  OpportunityNotAcceptedError,
  OpportunityNotFoundError,
} from '../../domain/errors'
import type {
  AdjustmentIndex,
  Contract,
  ContractGuaranteeType,
  ContractType,
  NewContractParty,
} from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export interface CreateContractFromOpportunityInput {
  actorTenantId: string
  actorPapel: Papel
  opportunityId: string
  type: ContractType
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  owner: Omit<NewContractParty, 'role'>
  tenant: Omit<NewContractParty, 'role'>
  guarantor: Omit<NewContractParty, 'role'> | null
}

export class CreateContractFromOpportunityUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: CreateContractFromOpportunityInput): Promise<Contract> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar contratos.')
    }

    if (input.guaranteeType === 'FIADOR' && !input.guarantor) {
      throw new GuarantorPartyRequiredError()
    }

    const opportunity = await this.contractRepository.findEligibleOpportunity(
      input.actorTenantId,
      input.opportunityId,
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

    return this.contractRepository.create({
      tenantId: input.actorTenantId,
      opportunityId: input.opportunityId,
      type: input.type,
      dueDay: input.dueDay,
      startDate: input.startDate,
      endDate: input.endDate,
      adjustmentIndex: input.adjustmentIndex,
      guaranteeType: input.guaranteeType,
      notes: input.notes,
      parties,
    })
  }
}
