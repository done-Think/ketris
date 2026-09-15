import type { LeadFilter, LeadFilterKey, LeadStage } from '../types/lead'

export const leadFilters: readonly {
  label: LeadFilter
  labelKey: LeadFilterKey
  stage: LeadStage | null
}[] = [
  { label: 'Todos', labelKey: 'all', stage: null },
  { label: 'Novo', labelKey: 'new', stage: 'Novo' },
  { label: 'Em contato', labelKey: 'contacted', stage: 'Em contato' },
  { label: 'Visita marcada', labelKey: 'visitScheduled', stage: 'Visita marcada' },
  { label: 'Proposta', labelKey: 'proposal', stage: 'Proposta' },
]
