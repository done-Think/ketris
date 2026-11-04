import type { AppLocale } from '@/i18n/types/locale.types'
import type { CrmFormatters } from '../types/formatters'
import type { DashboardLead, Lead } from '../types/lead'
import { formatLeadRelativeDate } from './format-lead'

export function toDashboardLead(
  lead: Lead,
  locale?: AppLocale,
  format?: CrmFormatters,
): DashboardLead {
  const canonicalBudget =
    lead.source === 'MARKETPLACE' && lead.opportunityId
      ? /^R\$\s*([\d.]+),(\d{2})$/.exec(lead.budget)
      : null
  const amount = canonicalBudget
    ? Number(canonicalBudget[1].replaceAll('.', '') + '.' + canonicalBudget[2])
    : null
  return {
    id: lead.id,
    name: lead.name,
    budget:
      amount !== null && Number.isFinite(amount) && format ? format.money(amount) : lead.budget,
    phone: lead.phone,
    email: lead.email ?? '',
    lastContact: format?.relative(lead.updatedAt) ?? formatLeadRelativeDate(lead.updatedAt, locale),
    lastContactAt: lead.updatedAt,
    interest: lead.interest,
    source: lead.source,
    broker: lead.responsibleName ?? '',
    stage: lead.stage,
    opportunityId: lead.opportunityId,
  }
}
