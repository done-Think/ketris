import type { OpportunityResponseAction } from '../types/opportunity-status.types'
import type { OpportunityStatus } from './opportunity.entity'
export type { OpportunityResponseAction } from '../types/opportunity-status.types'

const allowedTransitions: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  RASCUNHO: ['ENVIADA', 'RECUSADA'],
  ENVIADA: ['EM_NEGOCIACAO', 'ACEITA', 'RECUSADA'],
  EM_NEGOCIACAO: ['ENVIADA', 'ACEITA', 'RECUSADA'],
  ACEITA: [],
  RECUSADA: ['EM_NEGOCIACAO'],
}

export function canTransition(from: OpportunityStatus, to: OpportunityStatus): boolean {
  if (from === to) return true

  return allowedTransitions[from].includes(to)
}

export function allowedNextStatuses(from: OpportunityStatus): readonly OpportunityStatus[] {
  return allowedTransitions[from]
}

const responseTargetStatus: Record<OpportunityResponseAction, OpportunityStatus> = {
  ACEITAR: 'ACEITA',
  RECUSAR: 'RECUSADA',
  SOLICITAR_INFORMACOES: 'EM_NEGOCIACAO',
}

export function statusForResponse(action: OpportunityResponseAction): OpportunityStatus {
  return responseTargetStatus[action]
}

export function canRespond(status: OpportunityStatus): boolean {
  return status === 'ENVIADA' || status === 'EM_NEGOCIACAO' || status === 'RECUSADA'
}
