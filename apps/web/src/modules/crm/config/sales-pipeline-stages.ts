import { brand, supportColor } from '@shared/theme/tokens'

import type { SalesPipelineStage } from '../types/sales-pipeline'

export const salesPipelineStages: readonly SalesPipelineStage[] = [
  {
    id: 'prospecting',
    labelKey: 'prospecting',
    statuses: ['DRAFT'],
    color: brand.magenta[500],
    softColor: brand.magenta[50],
  },
  {
    id: 'qualification',
    labelKey: 'qualification',
    statuses: [],
    color: brand.semantic.info,
    softColor: supportColor.infoSoft,
  },
  {
    id: 'proposal',
    labelKey: 'proposal',
    statuses: ['SENT'],
    color: brand.semantic.warning,
    softColor: supportColor.warningSoft,
  },
  {
    id: 'negotiation',
    labelKey: 'negotiation',
    statuses: ['IN_NEGOTIATION'],
    color: supportColor.orange,
    softColor: supportColor.orangeSoft,
  },
  {
    id: 'closed',
    labelKey: 'closed',
    statuses: ['ACCEPTED', 'REJECTED'],
    color: brand.semantic.success,
    softColor: supportColor.successSoft,
  },
] as const
