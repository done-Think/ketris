import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { CrmFormatters } from '../types/formatters'
import type { Opportunity } from '../types/opportunity'
import type { CrmPropertyDetail, CrmPropertySummary } from '../types/property'
import { formatCurrency, formatDate, formatMonthlyCurrency } from './formatters'

import type {
  ProposalManagementListItem,
  ProposalManagementProperty,
  ProposalTransactionKind,
} from '../types/proposal-management'

function toTransactionKind(
  property: CrmPropertyDetail | CrmPropertySummary | undefined,
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
  property: CrmPropertyDetail | CrmPropertySummary | undefined,
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
  property: CrmPropertyDetail | CrmPropertySummary | undefined,
  fallbackAddressLabel: string,
  locale: AppLocale = defaultLocale,
  format?: CrmFormatters,
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
    valueLabel:
      format?.money(opportunity.proposedValue, transactionKind === 'rent') ??
      toValueLabel(opportunity.proposedValue, transactionKind, locale),
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    createdLabel: format?.date(opportunity.createdAt) ?? formatDate(opportunity.createdAt, locale),
  }
}
