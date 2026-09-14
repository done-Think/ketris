import type { Opportunity } from '@modules/crm/types/opportunity'
import type { PublicPropertyDetail, PublicPropertySummary } from '@modules/crm/types/property'
import { formatCurrency, formatDate, formatMonthlyCurrency } from '@modules/crm/utils/formatters'

import type {
  ProposalManagementListItem,
  ProposalManagementProperty,
  ProposalManagementStatusCounts,
  ProposalManagementSummary,
  ProposalTransactionKind,
} from '../types/proposal-management'
import { proposalManagementStatuses } from '../config/proposal-statuses'

function toTransactionKind(
  property: PublicPropertyDetail | PublicPropertySummary | undefined,
): ProposalTransactionKind {
  return property?.purpose === 'ALUGUEL' ? 'rent' : 'sale'
}

function toValueLabel(amount: number, transactionKind: ProposalTransactionKind): string {
  return transactionKind === 'rent' ? formatMonthlyCurrency(amount) : formatCurrency(amount)
}

function toReference(opportunityId: string): string {
  return `PRP-${opportunityId.slice(0, 8).toUpperCase()}`
}

function toProperty(
  propertyId: string,
  property: PublicPropertyDetail | PublicPropertySummary | undefined,
  fallbackAddressLabel: string,
): ProposalManagementProperty {
  if (!property) {
    return { id: propertyId, title: propertyId, address: fallbackAddressLabel }
  }

  const address =
    'address' in property && property.address
      ? [property.address.street, property.address.neighborhood, property.address.city]
          .filter(Boolean)
          .join(', ')
      : [property.neighborhood, property.city].filter(Boolean).join(', ') || fallbackAddressLabel

  return {
    id: property.id,
    title: property.title,
    address,
    thumbnailUrl: property.coverUrl ?? undefined,
  }
}

export function mapOpportunityToProposalListItem(
  opportunity: Opportunity,
  property: PublicPropertyDetail | PublicPropertySummary | undefined,
  fallbackAddressLabel: string,
): ProposalManagementListItem {
  const transactionKind = toTransactionKind(property)

  return {
    id: opportunity.id,
    reference: toReference(opportunity.id),
    lead: {
      id: opportunity.contactId ?? opportunity.id,
      name: opportunity.leadName,
      email: opportunity.leadEmail,
    },
    property: toProperty(opportunity.propertyId, property, fallbackAddressLabel),
    amount: opportunity.proposedValue,
    transactionKind,
    valueLabel: toValueLabel(opportunity.proposedValue, transactionKind),
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    createdLabel: formatDate(opportunity.createdAt),
  }
}

export function buildProposalManagementSummary(
  items: readonly ProposalManagementListItem[],
): ProposalManagementSummary {
  const statusCounts = Object.fromEntries(
    proposalManagementStatuses.map((status) => [
      status,
      items.filter((item) => item.status === status).length,
    ]),
  ) as ProposalManagementStatusCounts

  const acceptedItems = items.filter((item) => item.status === 'ACEITA')
  const acceptedTotalAmount = acceptedItems.reduce((total, item) => total + item.amount, 0)
  const conversionRate = items.length > 0 ? acceptedItems.length / items.length : 0

  return {
    totalCount: items.length,
    statusCounts,
    negotiationCount: statusCounts.EM_NEGOCIACAO,
    acceptedTotalAmount,
    acceptedTotalLabel: formatCurrency(acceptedTotalAmount),
    conversionRate,
    conversionRateLabel: `${Math.round(conversionRate * 100)}%`,
  }
}
