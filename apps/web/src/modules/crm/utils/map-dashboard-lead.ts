import type { AppLocale } from '@/i18n/types/locale.types'
import type { CrmFormatters } from '../types/formatters'
import type { DashboardLead, Lead } from '../types/lead'
import { formatLeadRelativeDate } from './format-lead'

export function toDashboardLead(
  lead: Lead,
  locale?: AppLocale,
  format?: CrmFormatters,
): DashboardLead {
  return {
    id: lead.id,
    name: lead.name,
    budget: lead.budget,
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
