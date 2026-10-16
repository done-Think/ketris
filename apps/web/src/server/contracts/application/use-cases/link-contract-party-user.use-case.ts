import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'

import type {
  ContractPartyUserLink,
  LinkContractPartyUserInput,
} from '../../types/contract-party-user-link'
import {
  ContractNotFoundError,
  ContractPartyNotFoundError,
  ContractRenterUserNotFoundError,
} from '../../domain/errors'
import type { ContractRepository } from '../ports/contract-repository.port'

export class LinkContractPartyUserUseCase {
  constructor(
    private readonly contractRepository: Pick<ContractRepository, 'findById' | 'linkPartyUser'>,
    private readonly userRepository: Pick<UserRepository, 'findByEmail'>,
  ) {}

  async execute(input: LinkContractPartyUserInput): Promise<ContractPartyUserLink> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem vincular locatários a contratos.')
    }

    const contract = await this.contractRepository.findById(input.actorTenantId, input.contractId)

    if (!contract) {
      throw new ContractNotFoundError()
    }

    const party = contract.parties.find((candidate) => candidate.id === input.partyId)

    if (!party || party.role !== 'LOCATARIO') {
      throw new ContractPartyNotFoundError()
    }

    const email = normalizeEmail(input.email)

    if (normalizeEmail(party.email) !== email) {
      throw new ConflictError('O e-mail deve corresponder à parte locatária do contrato.')
    }

    const user = await this.userRepository.findByEmail(email)

    if (!user || user.papel !== 'RENTER' || !user.ativo) {
      throw new ContractRenterUserNotFoundError()
    }

    if (party.userId && party.userId !== user.id) {
      throw new ConflictError('Esta parte do contrato já está vinculada a outro usuário.')
    }

    const linked = await this.contractRepository.linkPartyUser({
      tenantId: input.actorTenantId,
      contractId: input.contractId,
      partyId: input.partyId,
      userId: user.id,
      email,
    })

    if (!linked) {
      throw new ConflictError(
        'A parte do contrato foi alterada. Revise o vínculo e tente novamente.',
      )
    }

    return { partyId: party.id, userId: user.id }
  }
}
