import type { OpportunityResponseAction } from '../types/opportunity-status.types'
import type { OpportunityStatus } from './opportunity.entity'
export type { OpportunityResponseAction } from '../types/opportunity-status.types'

const allowedTransitions: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  DRAFT: ['SENT', 'REJECTED'],
  SENT: ['IN_NEGOTIATION', 'ACCEPTED', 'REJECTED'],
  IN_NEGOTIATION: ['SENT', 'ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: ['IN_NEGOTIATION'],
}

export function canTransition(from: OpportunityStatus, to: OpportunityStatus): boolean {
  if (from === to) return true

  return allowedTransitions[from].includes(to)
}

export function allowedNextStatuses(from: OpportunityStatus): readonly OpportunityStatus[] {
  return allowedTransitions[from]
}

const responseTargetStatus: Record<OpportunityResponseAction, OpportunityStatus> = {
  ACCEPT: 'ACCEPTED',
  REJECT: 'REJECTED',
  REQUEST_INFORMATION: 'IN_NEGOTIATION',
}

export function statusForResponse(action: OpportunityResponseAction): OpportunityStatus {
  return responseTargetStatus[action]
}

export function canRespond(status: OpportunityStatus): boolean {
  return status === 'SENT' || status === 'IN_NEGOTIATION' || status === 'REJECTED'
}
