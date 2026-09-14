import { alpha, brand, supportColor } from '@shared/theme/tokens'

import type {
  LeadStage,
  LeadStageLabelKey,
  LeadStageStyle,
  LeadStatusFilterOption,
} from '../types/lead'

export const leadStatusFilters: LeadStatusFilterOption[] = [
  { labelKey: 'all', label: 'Todos' },
  { labelKey: 'new', label: 'Novo' },
  { labelKey: 'contacted', label: 'Em contato' },
  { labelKey: 'visitScheduled', label: 'Visita marcada' },
  { labelKey: 'proposal', label: 'Proposta' },
]

export const leadStageLabelKeys: Record<LeadStage, LeadStageLabelKey> = {
  Novo: 'new',
  'Em contato': 'contacted',
  'Visita marcada': 'visitScheduled',
  Proposta: 'proposal',
}

export const leadStageStyles: Record<LeadStage, LeadStageStyle> = {
  Novo: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
  'Em contato': { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  'Visita marcada': { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  Proposta: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
}

export const leadTableColumnKeys = [
  'name',
  'interest',
  'budget',
  'status',
  'source',
  'lastContact',
  'actions',
] as const
