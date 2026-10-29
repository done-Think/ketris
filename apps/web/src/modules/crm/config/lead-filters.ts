import type { LeadFilter, LeadFilterKey, LeadStage } from '../types/lead'

export const leadFilters: readonly {
  label: LeadFilter
  labelKey: LeadFilterKey
  stage: LeadStage | null
}[] = [
  { label: 'ALL', labelKey: 'all', stage: null },
  { label: 'NEW', labelKey: 'new', stage: 'NEW' },
  { label: 'IN_CONTACT', labelKey: 'contacted', stage: 'IN_CONTACT' },
  { label: 'VISIT_SCHEDULED', labelKey: 'visitScheduled', stage: 'VISIT_SCHEDULED' },
  { label: 'PROPOSAL', labelKey: 'proposal', stage: 'PROPOSAL' },
]
