import type { ActivityType } from '../domain/activity.entity'
import type { GuaranteeType, OpportunityStatus } from '../domain/opportunity.entity'

export const CRM_STATUS_KEYS = {
  DRAFT: 'draft',
  SENT: 'sent',
  IN_NEGOTIATION: 'inNegotiation',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const
export const CRM_GUARANTEE_KEYS = {
  NONE: 'none',
  GUARANTOR: 'guarantor',
  DEPOSIT: 'deposit',
  SURETY_BOND: 'insurance',
} as const
export const CRM_ACTIVITY_KEYS = {
  NOTE: 'note',
  STATUS_CHANGE: 'statusChanged',
  CONTACT_MADE: 'contactMade',
  PROPOSAL_ANSWERED: 'proposalResponded',
} as const
const systemActionKeys: Record<
  string,
  | 'opportunityCreated'
  | 'statusChanged'
  | 'responsibleChanged'
  | 'accepted'
  | 'rejected'
  | 'informationRequested'
> = {
  OPPORTUNITY_CREATED: 'opportunityCreated',
  STATUS_CHANGED: 'statusChanged',
  RESPONSIBLE_CHANGED: 'responsibleChanged',
  ACCEPT: 'accepted',
  REJECT: 'rejected',
  REQUEST_INFORMATION: 'informationRequested',
  ACEITAR: 'accepted',
  RECUSAR: 'rejected',
  SOLICITAR_INFORMACOES: 'informationRequested',
}
export function crmStatusKey(status: OpportunityStatus) {
  return CRM_STATUS_KEYS[status]
}
export function crmGuaranteeKey(guarantee: GuaranteeType) {
  return CRM_GUARANTEE_KEYS[guarantee]
}
export function crmActivityKey(type: ActivityType) {
  return CRM_ACTIVITY_KEYS[type]
}
export function crmSystemActionKey(action: string | null | undefined) {
  return action && Object.hasOwn(systemActionKeys, action) ? systemActionKeys[action] : null
}
