import type { Papel } from '@server/auth/domain/user.entity'
export type AgendaEventStatus = 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'

export type AgendaEventAudience = 'SHARED_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'

export type AgendaEventKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface AgendaEventLinkedUser {
  id: string
  nome: string
  email: string
}

export interface NewAgendaEvent {
  tenantId: string
  responsavelId: string
  criadoPorId: string | null
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  titulo: string
  tipo?: AgendaEventKind | null
  destino?: AgendaEventAudience
  interno?: boolean
  inicio: Date
  fim: Date
  participanteNome: string
  participanteTelefone: string
  notas?: string | null
}

export interface AgendaEventChanges {
  motivoCancelamento?: string
  inicio?: Date
  fim?: Date
  destino?: AgendaEventAudience
  interno?: boolean
  responsavelId?: string
  titulo?: string
  tipo?: AgendaEventKind | null
  status?: AgendaEventStatus
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  participanteNome?: string
  participanteTelefone?: string
  notas?: string | null
}

export interface AgendaEventLinks {
  donoEmail?: string | null
  participanteEmails?: string[]
}

export interface AgendaEventReschedule {
  inicio: Date
  fim: Date
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
  responsavelId?: string
}

export interface AgendaEventCreator {
  nome: string
  papel: Papel
}
