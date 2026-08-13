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
    color: '#F30274',
    softColor: '#FEEBF4',
  },
  {
    status: 'ENVIADA',
    label: 'Proposta enviada',
    color: '#3B82F6',
    softColor: '#EAF2FF',
  },
  {
    status: 'EM_NEGOCIACAO',
    label: 'Negociação',
    color: '#E0A11B',
    softColor: '#FFF7DD',
  },
  {
    status: 'ACEITA',
    label: 'Fechado',
    color: '#12A150',
    softColor: '#E7F7EE',
  },
  {
    status: 'RECUSADA',
    label: 'Perdido',
    color: '#E5484D',
    softColor: '#FDEBEC',
  },
] as const

export const opportunityStageByStatus = Object.fromEntries(
  opportunityStages.map((stage) => [stage.status, stage]),
) as Record<OpportunityStatus, OpportunityStage>
