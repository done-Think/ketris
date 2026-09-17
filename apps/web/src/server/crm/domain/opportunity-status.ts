import type { OpportunityStatus } from './opportunity.entity'

/**
 * Valid transitions for the funnel. Before this the PATCH accepted any status, which allowed
 * regressing an already-accepted proposal back to draft and desyncing the funnel from any
 * contract already generated from it.
 *
 * `ACEITA` (accepted) is deliberately terminal: an accepted opportunity is a prerequisite for
 * creating the Contract (FR-014, specs/001-mvp-loop-imovel-pagamento). Leaving it would orphan
 * the contract from its source. `RECUSADA` (rejected) is not terminal — lost business can be
 * revived, and the board allows dragging it back.
 */
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

/** The broker's response actions to a received proposal. */
export type OpportunityResponseAction = 'ACEITAR' | 'RECUSAR' | 'SOLICITAR_INFORMACOES'

const responseTargetStatus: Record<OpportunityResponseAction, OpportunityStatus> = {
  ACEITAR: 'ACEITA',
  RECUSAR: 'RECUSADA',
  SOLICITAR_INFORMACOES: 'EM_NEGOCIACAO',
}

export function statusForResponse(action: OpportunityResponseAction): OpportunityStatus {
  return responseTargetStatus[action]
}

/**
 * Only a proposal that has reached the broker can be responded to. `RASCUNHO` (draft) hasn't been
 * sent yet, and `ACEITA` (accepted) already reached a resolution — responding again would reopen
 * an already-closed funnel.
 */
export function canRespond(status: OpportunityStatus): boolean {
  return status === 'ENVIADA' || status === 'EM_NEGOCIACAO' || status === 'RECUSADA'
}
