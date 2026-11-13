import type { AppLocale } from '@/i18n/types/locale.types'
import type { CrmFormatters } from '../types/formatters'
import type { DashboardLead, Lead } from '../types/lead'
import { formatLeadRelativeDate } from './format-lead'
import { parseLeadBudget } from './parse-lead-budget'
import { formatCurrency } from './formatters'

export function toDashboardLead(
  lead: Lead,
  locale?: AppLocale,
  format?: CrmFormatters,
): DashboardLead {
  const amount = parseLeadBudget(lead.budget)
  return {
    id: lead.id,
    name: lead.name,
    budget:
      amount !== null ? (format?.money(amount) ?? formatCurrency(amount, locale)) : lead.budget,
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
