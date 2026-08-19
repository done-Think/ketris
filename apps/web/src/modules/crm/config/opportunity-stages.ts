import { brand, supportColor } from '@shared/theme/tokens'

import type { OpportunityStatus } from '../types/opportunity'

export type OpportunityStage = {
  status: OpportunityStatus
  label: string
  color: string
  softColor: string
}

export const opportunityStages: readonly OpportunityStage[] = [
  {
    status: 'RASCUNHO',
    label: 'Prospecção',
    color: brand.magenta[500],
    softColor: brand.magenta[50],
  },
  {
    status: 'ENVIADA',
    label: 'Proposta enviada',
    color: brand.semantic.info,
    softColor: supportColor.infoSoft,
  },
  {
    status: 'EM_NEGOCIACAO',
    label: 'Negociação',
    color: brand.semantic.warning,
    softColor: supportColor.warningSoft,
  },
  {
    status: 'ACEITA',
    label: 'Fechado',
    color: brand.semantic.success,
    softColor: supportColor.successSoft,
  },
  {
    status: 'RECUSADA',
    label: 'Perdido',
    color: brand.semantic.error,
    softColor: supportColor.errorSoft,
  },
] as const

export const opportunityStageByStatus = Object.fromEntries(
  opportunityStages.map((stage) => [stage.status, stage]),
) as Record<OpportunityStatus, OpportunityStage>
