import type { LeadFilter, LeadFilterKey, LeadStage } from '../types/lead'

export const leadFilters: readonly {
  label: LeadFilter
  labelKey: LeadFilterKey
  stage: LeadStage | null
}[] = [
  { label: 'ALL', labelKey: 'all', stage: null },
  { label: 'NOVO', labelKey: 'new', stage: 'NOVO' },
  { label: 'EM_CONTATO', labelKey: 'contacted', stage: 'EM_CONTATO' },
  { label: 'VISITA_MARCADA', labelKey: 'visitScheduled', stage: 'VISITA_MARCADA' },
  { label: 'PROPOSTA', labelKey: 'proposal', stage: 'PROPOSTA' },
]
