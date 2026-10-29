import type { UserRole } from '@server/auth/domain/user.entity'

export interface ContractPartyUserLink {
  partyId: string
  userId: string
}

interface ContractPartyUserLinkActor {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  contractId: string
  partyId: string
}

export type LinkContractPartyUserInput = ContractPartyUserLinkActor &
  ({ email: string; userId?: never } | { userId: string; email?: never })

export interface LinkContractPartyUserData {
  tenantId: string
  contractId: string
  partyId: string
  userId: string
  email: string
}

export interface AuditedContractPartyUserLinkData extends LinkContractPartyUserData {
  actorId: string
}

export interface LinkContractPartyUserRouteContext {
  params: Promise<{ id: string; partyId: string }>
}
