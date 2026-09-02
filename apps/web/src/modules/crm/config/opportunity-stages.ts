import { brand, supportColor } from '@shared/theme/tokens'

import type { OpportunityStatus } from '../types/opportunity'
import type { OpportunityStage } from '../types/opportunity-stage'

export const opportunityStages: readonly OpportunityStage[] = [
  {
    status: 'RASCUNHO',
    label: 'Prospecção',
    labelKey: 'draft',
    color: brand.magenta[500],
    softColor: brand.magenta[50],
  },
  {
    status: 'ENVIADA',
    label: 'Proposta enviada',
    labelKey: 'sent',
    color: brand.semantic.info,
    softColor: supportColor.infoSoft,
  },
  {
    status: 'EM_NEGOCIACAO',
    label: 'Negociação',
    labelKey: 'negotiation',
    color: brand.semantic.warning,
    softColor: supportColor.warningSoft,
  },
  {
    status: 'ACEITA',
    label: 'Fechado',
    labelKey: 'accepted',
    color: brand.semantic.success,
    softColor: supportColor.successSoft,
  },
  {
    status: 'RECUSADA',
    label: 'Perdido',
    labelKey: 'rejected',
    color: brand.semantic.error,
    softColor: supportColor.errorSoft,
  },
] as const

export const opportunityStageByStatus = Object.fromEntries(
  opportunityStages.map((stage) => [stage.status, stage]),
) as Record<OpportunityStatus, OpportunityStage>
