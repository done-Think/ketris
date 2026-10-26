import type { Papel } from '@server/auth/domain/user.entity'
import type { ContractManageScope } from './contract-entity'

export interface ContractOpportunityOwner {
  id: string
  name: string
  email: string
  phone: string | null
}

export interface ContractOpportunity {
  id: string
  leadName: string
  leadEmail: string
  leadPhone: string | null
  propertyId: string
  propertyTitle: string
  propertyAddress: string
  proposedValue: number
  owner: ContractOpportunityOwner | null
}

export interface ContractOpportunitiesPage {
  items: ContractOpportunity[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ContractOpportunitiesQuery extends ContractManageScope {
  tenantId: string
  search?: string
  page: number
  pageSize: number
}

export interface ListContractOpportunitiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  search?: string
  page: number
  pageSize: number
}
