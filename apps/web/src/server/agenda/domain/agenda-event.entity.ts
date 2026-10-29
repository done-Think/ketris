import type {
  AgendaEventLinkedUser,
  AgendaEventCreator,
  AgendaEventAudience,
  AgendaEventStatus,
  AgendaEventKind,
} from '../types/agenda-event'

export interface AgendaEvent {
  id: string
  tenantId: string
  responsibleId: string
  responsibleName: string
  createdById: string | null
  createdBy?: AgendaEventCreator | null
  ownerUserId: string | null
  dono: AgendaEventLinkedUser | null
  participants: AgendaEventLinkedUser[]
  propertyLabel?: string | null
  propertyId: string | null
  freeFormPropertyReference: string | null
  title: string
  type: AgendaEventKind | null
  audience?: AgendaEventAudience
  internal?: boolean
  status: AgendaEventStatus
  start: Date
  end: Date
  participantName: string
  participantPhone: string
  notes: string | null
  canceledAt?: Date | null
  canceledById?: string | null
  cancellationReason?: string | null
  createdAt: Date
  updatedAt: Date
}
