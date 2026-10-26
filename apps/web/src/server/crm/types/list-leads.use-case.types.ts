import type { Papel } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'
import type { CrmListFilters, CrmPage } from './pagination'

export interface ListLeadsInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  filters?: CrmListFilters & { stage?: Lead['stage'] }
}

export type ListLeadsOutput = CrmPage<Lead>
