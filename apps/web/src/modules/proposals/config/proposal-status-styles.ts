import { alpha, brand } from '@shared/theme/tokens'

import type { ProposalStatus, ProposalStatusStyle } from '../types/proposal'

export const proposalStatusStyles: Record<ProposalStatus, ProposalStatusStyle> = {
  underReview: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  counteroffer: { bgcolor: alpha.magenta[6], color: brand.magenta[700] },
  approved: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
}
