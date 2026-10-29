import type { UserRole } from '@server/auth/domain/user.entity'
import type {
  AgendaEventKind,
  AgendaEventAudience,
  AgendaEventChanges,
  AgendaEventLinks,
} from './agenda-event'

export interface CancelAgendaEventInput {
  reason: string
  actorTenantId: string
  actorRole: UserRole
  actorUserId?: string
  id: string
}

export interface CreateAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorUserId: string
  actorRole: UserRole
  responsibleId?: string
  audience?: AgendaEventAudience
  internal?: boolean
  propertyId?: string | null
  freeFormPropertyReference?: string | null
  title: string
  type?: AgendaEventKind | null
  start: Date
  durationMinutes: number
  participantName: string
  participantPhone: string
  notes?: string | null
  ownerEmail?: string
  participantEmails?: string[]
}

export interface GetAgendaEventInput {
  actorTenantId: string
  actorUserId: string
  actorRole: UserRole
  id: string
}

export interface ListAgendaEventsInput {
  actorTenantId: string
  actorUserId: string
  actorRole: UserRole
  from: Date
  to: Date
  responsibleId?: string
}

export interface RescheduleAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorRole: UserRole
  actorUserId?: string
  id: string
  start: Date
  durationMinutes?: number
}

export interface UpdateAgendaEventInput extends AgendaEventChanges, AgendaEventLinks {
  outsideBusinessHoursConfirmed?: boolean
  durationMinutes?: number
  actorTenantId: string
  actorRole: UserRole
  actorUserId?: string
  id: string
}
