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
  responsavelId: string
  responsavelNome: string
  criadoPorId: string | null
  criadoPor?: AgendaEventCreator | null
  donoUsuarioId: string | null
  dono: AgendaEventLinkedUser | null
  participantes: AgendaEventLinkedUser[]
  propertyLabel?: string | null
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
  canceladoEm?: Date | null
  canceladoPorId?: string | null
  motivoCancelamento?: string | null
  createdAt: Date
  updatedAt: Date
}
