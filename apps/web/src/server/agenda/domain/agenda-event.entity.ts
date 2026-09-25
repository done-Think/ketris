export type AgendaEventStatus = 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'

export type AgendaEventKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface AgendaEvent {
  id: string
  tenantId: string
  responsavelId: string
  criadoPorId: string | null
  imovelId: string | null
  referenciaImovelLivre: string | null
  titulo: string
  tipo: AgendaEventKind | null
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
  inicio: Date
  fim: Date
  participanteNome: string
  participanteTelefone: string
  notas?: string | null
}

export interface AgendaEventChanges {
  titulo?: string
  tipo?: AgendaEventKind | null
  status?: AgendaEventStatus
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  participanteNome?: string
  participanteTelefone?: string
  notas?: string | null
}

export interface AgendaEventReschedule {
  inicio: Date
  fim: Date
}

export interface AgendaEventListFilters {
  tenantId: string
  from: Date
  to: Date
  responsavelId?: string
}
