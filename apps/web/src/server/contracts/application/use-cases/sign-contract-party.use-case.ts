import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import {
  ContractNotFoundError,
  ContractPartyAlreadySignedError,
  ContractPartyNotFoundError,
} from '../../domain/errors'
import type { Contract } from '../../domain/contract.entity'
import type { ContractRepository } from '../ports/contract-repository.port'

export interface SignContractPartyInput {
  actorTenantId: string
  actorPapel: Papel
  contractId: string
  partyId: string
}

export class SignContractPartyUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async execute(input: SignContractPartyInput): Promise<Contract> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar contratos.')
    }

    const contract = await this.contractRepository.findById(input.actorTenantId, input.contractId)

    if (!contract) {
      throw new ContractNotFoundError()
    }

    const party = contract.parties.find((candidate) => candidate.id === input.partyId)

    if (!party) {
      throw new ContractPartyNotFoundError()
    }

    if (party.signatureStatus === 'ASSINADA') {
      throw new ContractPartyAlreadySignedError()
    }

    return this.contractRepository.signParty(input.actorTenantId, input.contractId, input.partyId)
  }
}
