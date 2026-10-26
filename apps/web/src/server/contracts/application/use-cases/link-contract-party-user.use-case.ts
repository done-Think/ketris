import { isAgencyManager } from '@server/auth/domain/roles'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import type {
  ContractPartyUserLink,
  LinkContractPartyUserInput,
} from '../../types/contract-party-user-link'
import { ContractNotFoundError } from '../../domain/errors'
import {
  assertContractRenterLink,
  assertRenterParty,
  selectContractRenterAccount,
} from '../../domain/contract-renter-link-policy'
import type { ContractPartyLinkTransaction } from '../ports/contract-party-link-transaction.port'

export class LinkContractPartyUserUseCase {
  constructor(private readonly transaction: ContractPartyLinkTransaction) {}

  async execute(input: LinkContractPartyUserInput): Promise<ContractPartyUserLink> {
    if (!isAgencyManager(input.actorPapel))
      throw new ForbiddenError(
        'Apenas a gestão da imobiliária pode vincular locatários a contratos.',
      )

    return this.transaction.run(async ({ contracts, users }) => {
      const contract = await contracts.findById(input.contractId, {
        kind: 'tenant',
        tenantId: input.actorTenantId,
      })
      if (!contract) throw new ContractNotFoundError()
      const party = contract.parties.find((candidate) => candidate.id === input.partyId)
      const email = input.email === undefined ? undefined : normalizeEmail(input.email)
      assertRenterParty(party, email)
      const user = input.userId
        ? await users.findById(input.userId)
        : selectContractRenterAccount(
            await users.findManyByEmail(email ?? normalizeEmail(party.email)),
            input.actorTenantId,
            party,
          )
      assertContractRenterLink(party, user)
      if (party.userId === user.id) return { partyId: party.id, userId: user.id }
      const linked = await contracts.linkPartyUser({
        tenantId: input.actorTenantId,
        actorId: input.actorId,
        contractId: input.contractId,
        partyId: input.partyId,
        userId: user.id,
        email: normalizeEmail(user.email),
      })
      if (!linked)
        throw new ConflictError(
          'A parte do contrato foi alterada. Revise o vínculo e tente novamente.',
        )
      return { partyId: party.id, userId: user.id }
    })
  }
}
