import { brand, supportColor } from '@shared/theme/tokens'

import type {
  ProposalManagementStatus,
  ProposalManagementStatusFilter,
  ProposalManagementStatusPresentation,
} from '../types/proposal-management'

export const proposalManagementStatuses = [
  'IN_NEGOTIATION',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'DRAFT',
] as const satisfies readonly ProposalManagementStatus[]

export const proposalStatusPresentations = {
  IN_NEGOTIATION: {
    color: brand.semantic.warning,
    backgroundColor: supportColor.warningSoft,
  },
  SENT: {
    color: brand.semantic.info,
    backgroundColor: supportColor.infoSoft,
  },
  ACCEPTED: {
    color: brand.semantic.success,
    backgroundColor: supportColor.successSoft,
  },
  REJECTED: {
    color: brand.magenta[700],
    backgroundColor: brand.magenta[50],
  },
  DRAFT: {
    color: brand.neutral[600],
    backgroundColor: brand.neutral[50],
  },
} as const satisfies Record<ProposalManagementStatus, ProposalManagementStatusPresentation>

export const proposalStatusFilters: readonly ProposalManagementStatusFilter[] = [
  { id: 'all' },
  ...proposalManagementStatuses.map((status) => ({ id: status })),
]
