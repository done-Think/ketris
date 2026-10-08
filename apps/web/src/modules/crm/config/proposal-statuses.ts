import { brand, supportColor } from '@shared/theme/tokens'

import type {
  ProposalManagementStatus,
  ProposalManagementStatusFilter,
  ProposalManagementStatusPresentation,
} from '../types/proposal-management'

export const proposalManagementStatuses = [
  'EM_NEGOCIACAO',
  'ENVIADA',
  'ACEITA',
  'RECUSADA',
  'RASCUNHO',
] as const satisfies readonly ProposalManagementStatus[]

export const proposalStatusPresentations = {
  EM_NEGOCIACAO: {
    color: brand.semantic.warning,
    backgroundColor: supportColor.warningSoft,
  },
  ENVIADA: {
    color: brand.semantic.info,
    backgroundColor: supportColor.infoSoft,
  },
  ACEITA: {
    color: brand.semantic.success,
    backgroundColor: supportColor.successSoft,
  },
  RECUSADA: {
    color: brand.magenta[700],
    backgroundColor: brand.magenta[50],
  },
  RASCUNHO: {
    color: brand.neutral[600],
    backgroundColor: brand.neutral[50],
  },
} as const satisfies Record<ProposalManagementStatus, ProposalManagementStatusPresentation>

export const proposalStatusFilters: readonly ProposalManagementStatusFilter[] = [
  { id: 'all' },
  ...proposalManagementStatuses.map((status) => ({ id: status })),
]
