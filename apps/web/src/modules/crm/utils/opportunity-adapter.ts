import type { Opportunity } from '../types/opportunity'
import type { PublicPropertyDetail, PublicPropertySummary } from '../types/property'
import { formatCurrency, formatDate, formatMonthlyCurrency } from './formatters'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

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

function toValueLabel(
  amount: number,
  transactionKind: ProposalTransactionKind,
  locale: AppLocale,
): string {
  return transactionKind === 'rent'
    ? formatMonthlyCurrency(amount, locale)
    : formatCurrency(amount, locale)
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
  locale: AppLocale = defaultLocale,
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
    valueLabel: toValueLabel(opportunity.proposedValue, transactionKind, locale),
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    createdLabel: formatDate(opportunity.createdAt, locale),
  }
}

export function buildProposalManagementSummary(
  items: readonly ProposalManagementListItem[],
  locale: AppLocale = defaultLocale,
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
    acceptedTotalLabel: formatCurrency(acceptedTotalAmount, locale),
    conversionRate,
    conversionRateLabel: `${Math.round(conversionRate * 100)}%`,
  }
}
