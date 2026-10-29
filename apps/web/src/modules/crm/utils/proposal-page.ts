import type { CrmFormatters } from '../types/formatters'
import type {
  ProposalManagementPage,
  ProposalManagementSummary,
} from '../types/proposal-management'
import type { ListOpportunitiesResponse } from '../types/service'
import { mapOpportunityToProposalListItem } from './opportunity-adapter'

export function toProposalPage(
  data: ListOpportunitiesResponse | undefined,
  format: CrmFormatters,
): ProposalManagementPage {
  const pagination = data?.pagination ?? { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 }
  const items = (data?.opportunities ?? []).map((opportunity) =>
    mapOpportunityToProposalListItem(
      opportunity,
      opportunity.property,
      opportunity.propertyId,
      format,
    ),
  )
  return {
    ...pagination,
    items,
    firstItem: items.length ? (pagination.page - 1) * pagination.pageSize + 1 : 0,
    lastItem: items.length ? (pagination.page - 1) * pagination.pageSize + items.length : 0,
  }
}
export function toProposalSummary(
  data: ListOpportunitiesResponse | undefined,
  format: CrmFormatters,
): ProposalManagementSummary {
  const groups = data?.groups ?? []
  const statusCounts = { DRAFT: 0, SENT: 0, IN_NEGOTIATION: 0, ACCEPTED: 0, REJECTED: 0 }
  for (const group of groups)
    if (group.key in statusCounts)
      statusCounts[group.key as keyof typeof statusCounts] = group.count
  const totalCount = groups.reduce((total, group) => total + group.count, 0)
  const acceptedTotalAmount = groups.find((group) => group.key === 'ACCEPTED')?.amount ?? 0
  const conversionRate = totalCount ? statusCounts.ACCEPTED / totalCount : 0
  return {
    statusCounts,
    totalCount,
    acceptedTotalAmount,
    acceptedTotalLabel: format.money(acceptedTotalAmount),
    conversionRate,
    conversionRateLabel: `${Math.round(conversionRate * 100)}%`,
    negotiationCount: statusCounts.IN_NEGOTIATION,
  }
}
