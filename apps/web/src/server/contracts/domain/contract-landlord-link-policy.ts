import { ConflictError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import { ContractLandlordUserNotFoundError, ContractPartyNotFoundError } from './errors'
import type { ContractRenterCandidate, RenterParty } from '../types/contract-renter-link'

export function isLandlordAccount(user: ContractRenterCandidate | null): boolean {
  return Boolean(
    user && user.active && user.role === 'OWNER' && user.tenantAccountType === 'INDIVIDUAL',
  )
}

export function selectContractLandlordAccount(
  users: ContractRenterCandidate[],
  party: RenterParty,
): ContractRenterCandidate | null {
  const candidates = users.filter(
    (user) => isLandlordAccount(user) && normalizeEmail(user.email) === normalizeEmail(party.email),
  )
  const linked = party.userId ? candidates.find((user) => user.id === party.userId) : null
  if (linked) return linked
  if (candidates.length > 1)
    throw new ConflictError('Há mais de uma conta de dono de imóvel para este e-mail.')
  return candidates[0] ?? null
}

export function assertLandlordParty(
  party: RenterParty | undefined,
  email?: string,
): asserts party is RenterParty {
  if (!party || party.role !== 'LANDLORD') throw new ContractPartyNotFoundError()
  if (email !== undefined && normalizeEmail(party.email) !== normalizeEmail(email)) {
    throw new ConflictError('O e-mail deve corresponder à parte locadora do contrato.')
  }
}

export function assertContractLandlordLink(
  party: RenterParty | undefined,
  user: ContractRenterCandidate | null,
): asserts user is ContractRenterCandidate {
  assertLandlordParty(party)
  if (!user || !isLandlordAccount(user)) throw new ContractLandlordUserNotFoundError()
  assertLandlordParty(party, user.email)
  if (party.userId && party.userId !== user.id) {
    throw new ConflictError('Esta parte do contrato já está vinculada a outro usuário.')
  }
}
