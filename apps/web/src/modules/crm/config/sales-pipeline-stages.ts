import { brand, supportColor } from '@shared/theme/tokens'

import type { SalesPipelineStage } from '../types/sales-pipeline'

export const salesPipelineStages: readonly SalesPipelineStage[] = [
  {
    id: 'prospecting',
    label: 'Prospecção',
    labelKey: 'prospecting',
    statuses: ['RASCUNHO'],
    color: brand.magenta[500],
    softColor: brand.magenta[50],
  },
  {
    id: 'qualification',
    label: 'Qualificação',
    labelKey: 'qualification',
    statuses: [],
    color: brand.semantic.info,
    softColor: supportColor.infoSoft,
  },
  {
    id: 'proposal',
    label: 'Proposta',
    labelKey: 'proposal',
    statuses: ['ENVIADA'],
    color: brand.semantic.warning,
    softColor: supportColor.warningSoft,
  },
  {
    id: 'negotiation',
    label: 'Negociação',
    labelKey: 'negotiation',
    statuses: ['EM_NEGOCIACAO'],
    color: supportColor.orange,
    softColor: supportColor.orangeSoft,
  },
  {
    id: 'closed',
    label: 'Fechado',
    labelKey: 'closed',
    statuses: ['ACEITA', 'RECUSADA'],
    color: brand.semantic.success,
    softColor: supportColor.successSoft,
  },
] as const

export const visibleSalesPipelineStatuses = new Set(
  salesPipelineStages.flatMap((stage) => stage.statuses),
)
