import type { Papel } from '@server/auth/domain/user.entity'

export interface ContractPartyUserLink {
  partyId: string
  userId: string
}

export interface LinkContractPartyUserInput {
  actorTenantId: string
  actorPapel: Papel
  contractId: string
  partyId: string
  email: string
}

export interface LinkContractPartyUserData {
  tenantId: string
  contractId: string
  partyId: string
  userId: string
  email: string
}

export interface LinkContractPartyUserRouteContext {
  params: Promise<{ id: string; partyId: string }>
}
