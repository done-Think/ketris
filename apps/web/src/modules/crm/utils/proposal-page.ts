import type { AppLocale } from '@/i18n/types/locale.types'
import type { CrmFormatters } from '../types/formatters'
import type {
  ProposalManagementPage,
  ProposalManagementSummary,
} from '../types/proposal-management'
import type { ListOpportunitiesResponse } from '../types/service'
import { formatCurrency } from './formatters'
import { mapOpportunityToProposalListItem } from './opportunity-adapter'

export function toProposalPage(
  data: ListOpportunitiesResponse | undefined,
  locale: AppLocale,
  format?: CrmFormatters,
): ProposalManagementPage {
  const pagination = data?.pagination ?? { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 }
  const items = (data?.opportunities ?? []).map((opportunity) =>
    mapOpportunityToProposalListItem(
      opportunity,
      opportunity.property,
      opportunity.propertyId,
      locale,
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
  locale: AppLocale,
  format?: CrmFormatters,
): ProposalManagementSummary {
  const groups = data?.groups ?? []
  const statusCounts = { RASCUNHO: 0, ENVIADA: 0, EM_NEGOCIACAO: 0, ACEITA: 0, RECUSADA: 0 }
  for (const group of groups)
    if (group.key in statusCounts)
      statusCounts[group.key as keyof typeof statusCounts] = group.count
  const totalCount = groups.reduce((total, group) => total + group.count, 0)
  const acceptedTotalAmount = groups.find((group) => group.key === 'ACEITA')?.amount ?? 0
  const conversionRate = totalCount ? statusCounts.ACEITA / totalCount : 0
  return {
    statusCounts,
    totalCount,
    acceptedTotalAmount,
    acceptedTotalLabel:
      format?.money(acceptedTotalAmount) ?? formatCurrency(acceptedTotalAmount, locale),
    conversionRate,
    conversionRateLabel: `${Math.round(conversionRate * 100)}%`,
    negotiationCount: statusCounts.EM_NEGOCIACAO,
  }
}
