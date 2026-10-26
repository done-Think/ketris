import type { Papel } from '@server/auth/domain/user.entity'
import type { ActivityType, OpportunityActivity } from '../domain/activity.entity'

export interface AddOpportunityNoteInput {
  actorTenantId: string
  actorId?: string | null
  actorPapel: Papel
  actorName?: string | null
  opportunityId: string
  description: string
  type?: Extract<ActivityType, 'NOTA' | 'CONTATO_REALIZADO'>
}

export type AddOpportunityNoteOutput = OpportunityActivity
