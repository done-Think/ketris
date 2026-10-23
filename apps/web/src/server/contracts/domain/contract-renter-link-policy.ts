import { ConflictError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import { ContractPartyNotFoundError, ContractRenterUserNotFoundError } from './errors'
import type { RenterParty, RenterAccount } from '../types/contract-renter-link'

export function assertRenterParty(
  party: RenterParty | undefined,
  email?: string,
): asserts party is RenterParty {
  if (!party || party.role !== 'LOCATARIO') throw new ContractPartyNotFoundError()
  if (email !== undefined && normalizeEmail(party.email) !== normalizeEmail(email)) {
    throw new ConflictError('O e-mail deve corresponder à parte locatária do contrato.')
  }
}

export function assertContractRenterLink(
  party: RenterParty | undefined,
  user: RenterAccount | null,
): asserts user is RenterAccount {
  assertRenterParty(party)
  if (!user || !user.ativo || user.papel !== 'RENTER') {
    throw new ContractRenterUserNotFoundError()
  }
  assertRenterParty(party, user.email)
  if (party.userId && party.userId !== user.id) {
    throw new ConflictError('Esta parte do contrato já está vinculada a outro usuário.')
  }
}
