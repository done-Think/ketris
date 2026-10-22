export type AgendaEventStatus = 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'
export type AgendaEventAudience = 'LEGACY_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'

export type AgendaEventKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface AgendaEventLinkedUser {
  id: string
  nome: string
  email: string
}

export interface AgendaEvent {
  id: string
  tenantId: string
  responsavelId: string
  responsavelNome: string
  criadoPorId: string | null
  donoUsuarioId: string | null
  dono: AgendaEventLinkedUser | null
  participantes: AgendaEventLinkedUser[]
  imovelId: string | null
  referenciaImovelLivre: string | null
  titulo: string
  tipo: AgendaEventKind | null
  destino?: AgendaEventAudience
  interno?: boolean
  status: AgendaEventStatus
  inicio: Date
  fim: Date
  participanteNome: string
  participanteTelefone: string
  notas: string | null
  createdAt: Date
  updatedAt: Date
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

/**
 * Owner/participant links identified by normalized e-mail, resolved and validated by the
 * repository inside the same transaction that writes the event.
 * - donoEmail: undefined keeps the current owner, null removes it, an e-mail sets/replaces it.
 * - participanteEmails: undefined keeps the current list, [] removes all, a list replaces it.
 */
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
