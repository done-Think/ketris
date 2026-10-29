import type { LeadSource, LeadSourceKey } from '../types/lead-source'

export const LEAD_SOURCES = [
  'MARKETPLACE',
  'WHATSAPP',
  'INSTAGRAM',
  'WEBSITE',
  'REFERRAL',
  'OTHER',
] as const

export const LEAD_SOURCE_KEYS = {
  MARKETPLACE: 'marketplace',
  WHATSAPP: 'whatsApp',
  INSTAGRAM: 'instagram',
  WEBSITE: 'site',
  REFERRAL: 'referral',
  OTHER: 'other',
} as const satisfies Record<LeadSource, string>

export function leadSourceKey(source: LeadSource): LeadSourceKey {
  return LEAD_SOURCE_KEYS[source]
}
