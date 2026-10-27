export const LEAD_SOURCES = [
  'MARKETPLACE',
  'WHATSAPP',
  'INSTAGRAM',
  'SITE',
  'INDICACAO',
  'OUTRA',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export const LEAD_SOURCE_KEYS = {
  MARKETPLACE: 'marketplace',
  WHATSAPP: 'whatsApp',
  INSTAGRAM: 'instagram',
  SITE: 'site',
  INDICACAO: 'referral',
  OUTRA: 'other',
} as const satisfies Record<LeadSource, string>

export type LeadSourceKey = (typeof LEAD_SOURCE_KEYS)[LeadSource]

export function leadSourceKey(source: LeadSource): LeadSourceKey {
  return LEAD_SOURCE_KEYS[source]
}
