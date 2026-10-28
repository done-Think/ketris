import type { UserRole } from '@server/auth/domain/user.entity'
import type { ActivityType, OpportunityActivity } from '../domain/activity.entity'

export interface AddOpportunityNoteInput {
  actorTenantId: string
  actorId?: string | null
  actorRole: UserRole
  actorName?: string | null
  opportunityId: string
  description: string
  type?: Extract<ActivityType, 'NOTE' | 'CONTACT_MADE'>
}

export type AddOpportunityNoteOutput = OpportunityActivity
