import type { ActivityType } from '../domain/activity.entity'
import type { GuaranteeType, OpportunityStatus } from '../domain/opportunity.entity'

export const CRM_STATUS_KEYS = {
  RASCUNHO: 'draft',
  ENVIADA: 'sent',
  EM_NEGOCIACAO: 'inNegotiation',
  ACEITA: 'accepted',
  RECUSADA: 'rejected',
} as const
export const CRM_GUARANTEE_KEYS = {
  NENHUMA: 'none',
  FIADOR: 'guarantor',
  CAUCAO: 'deposit',
  SEGURO_FIANCA: 'insurance',
} as const
export const CRM_ACTIVITY_KEYS = {
  NOTA: 'note',
  MUDANCA_STATUS: 'statusChanged',
  CONTATO_REALIZADO: 'contactMade',
  PROPOSTA_RESPONDIDA: 'proposalResponded',
} as const
const systemActionKeys: Record<string, string> = {
  OPPORTUNITY_CREATED: 'opportunityCreated',
  STATUS_CHANGED: 'statusChanged',
  RESPONSIBLE_CHANGED: 'responsibleChanged',
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
