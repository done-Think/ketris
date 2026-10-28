import { ConflictError } from '@server/shared/errors'
import { normalizeEmail } from '@server/shared/normalize-email'
import { ContractPartyNotFoundError, ContractRenterUserNotFoundError } from './errors'
import type {
  RenterParty,
  RenterAccount,
  ContractRenterCandidate,
} from '../types/contract-renter-link'

export function selectContractRenterAccount(
  users: ContractRenterCandidate[],
  tenantId: string,
  party: RenterParty,
): ContractRenterCandidate | null {
  const candidates = users.filter(
    (user) =>
      user.active &&
      user.role === 'RENTER' &&
      normalizeEmail(user.email) === normalizeEmail(party.email),
  )
  const linked = party.userId ? candidates.find((user) => user.id === party.userId) : null
  if (linked) return linked
  const local = candidates.filter((user) => user.tenantId === tenantId)
  const eligible = local.length ? local : candidates
  if (eligible.length > 1)
    throw new ConflictError('Há mais de uma conta de locatário elegível para este e-mail.')
  return eligible[0] ?? null
}

export function assertRenterParty(
  party: RenterParty | undefined,
  email?: string,
): asserts party is RenterParty {
  if (!party || party.role !== 'RENTER') throw new ContractPartyNotFoundError()
  if (email !== undefined && normalizeEmail(party.email) !== normalizeEmail(email)) {
    throw new ConflictError('O e-mail deve corresponder à parte locatária do contrato.')
  }
}

export function assertContractRenterLink(
  party: RenterParty | undefined,
  user: RenterAccount | null,
): asserts user is RenterAccount {
  assertRenterParty(party)
  if (!user || !user.active || user.role !== 'RENTER') {
    throw new ContractRenterUserNotFoundError()
  }
  assertRenterParty(party, user.email)
  if (party.userId && party.userId !== user.id) {
    throw new ConflictError('Esta parte do contrato já está vinculada a outro usuário.')
  }
}
