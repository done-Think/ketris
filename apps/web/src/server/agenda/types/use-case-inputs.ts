import type { Papel } from '@server/auth/domain/user.entity'
import type {
  AgendaEventKind,
  AgendaEventAudience,
  AgendaEventChanges,
  AgendaEventLinks,
} from './agenda-event'

export interface CancelAgendaEventInput {
  reason: string
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
}

export interface CreateAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  responsavelId?: string
  destino?: AgendaEventAudience
  interno?: boolean
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  titulo: string
  tipo?: AgendaEventKind | null
  inicio: Date
  durationMinutes: number
  participanteNome: string
  participanteTelefone: string
  notas?: string | null
  donoEmail?: string
  participanteEmails?: string[]
}

export interface GetAgendaEventInput {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  id: string
}

export interface ListAgendaEventsInput {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  from: Date
  to: Date
  responsavelId?: string
}

export interface RescheduleAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
  inicio: Date
  durationMinutes?: number
}

export interface UpdateAgendaEventInput extends AgendaEventChanges, AgendaEventLinks {
  outsideBusinessHoursConfirmed?: boolean
  durationMinutes?: number
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
}
