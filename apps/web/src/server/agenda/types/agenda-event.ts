import type { UserRole } from '@server/auth/domain/user.entity'
export type AgendaEventStatus = 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'

export type AgendaEventAudience = 'SHARED_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'

export type AgendaEventKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface AgendaEventLinkedUser {
  id: string
  name: string
  email: string
}

export interface NewAgendaEvent {
  tenantId: string
  responsibleId: string
  createdById: string | null
  propertyId?: string | null
  freeFormPropertyReference?: string | null
  title: string
  type?: AgendaEventKind | null
  audience?: AgendaEventAudience
  internal?: boolean
  start: Date
  end: Date
  participantName: string
  participantPhone: string
  notes?: string | null
}

export interface AgendaEventChanges {
  cancellationReason?: string
  start?: Date
  end?: Date
  audience?: AgendaEventAudience
  internal?: boolean
  responsibleId?: string
  title?: string
  type?: AgendaEventKind | null
  status?: AgendaEventStatus
  propertyId?: string | null
  freeFormPropertyReference?: string | null
  participantName?: string
  participantPhone?: string
  notes?: string | null
}

export interface AgendaEventLinks {
  ownerEmail?: string | null
  participantEmails?: string[]
}

export interface AgendaEventReschedule {
  start: Date
  end: Date
}

export type AgendaReadScope =
  | { kind: 'tenant'; tenantId: string }
  | { kind: 'agent'; tenantId: string; userId: string }
  | { kind: 'owner'; tenantId: string; userId: string }
  | { kind: 'linkedUser'; userId: string }

export interface AgendaEventListFilters {
  scope: AgendaReadScope
  from: Date
  to: Date
  responsibleId?: string
}

export interface AgendaEventCreator {
  name: string
  role: UserRole
}
