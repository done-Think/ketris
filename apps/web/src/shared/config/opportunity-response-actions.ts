export const opportunityResponseActions = ['ACCEPT', 'REJECT', 'REQUEST_INFORMATION'] as const

// Existing API v2 callers and immutable CRM timelines can still carry these values.
const legacyActions: Readonly<Record<string, (typeof opportunityResponseActions)[number]>> = {
  ACEITAR: 'ACCEPT',
  RECUSAR: 'REJECT',
  SOLICITAR_INFORMACOES: 'REQUEST_INFORMATION',
}

export function normalizeOpportunityResponseAction(action: string): string {
  return Object.hasOwn(legacyActions, action) ? legacyActions[action] : action
}
