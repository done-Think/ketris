import dayjs from 'dayjs'

import { formatCurrency } from '@shared/lib/utils/format'

import type { BuildDashboardMetricsParams, DashboardMetric } from '../types/dashboard-overview'

export function buildDashboardMetrics({
  leads,
  opportunities,
  monthEvents,
  financialSummary,
  today,
  t,
}: BuildDashboardMetricsParams): DashboardMetric[] {
  const activeLeads = leads.filter((lead) => lead.opportunityId === null)
  const leadsCreatedToday = activeLeads.filter((lead) =>
    dayjs(lead.createdAt).isSame(today, 'day'),
  ).length

  const visitEvents = monthEvents.filter((event) => event.kind === 'VISIT')
  const visitsToday = visitEvents.filter((event) => dayjs(event.start).isSame(today, 'day')).length

  const pendingOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === 'ENVIADA' || opportunity.status === 'EM_NEGOCIACAO',
  )
  const awaitingResponse = pendingOpportunities.filter(
    (opportunity) => opportunity.status === 'ENVIADA',
  ).length

  const monthlyReceivable = financialSummary?.monthlyReceivable ?? 0
  const overdueTotal = financialSummary?.overdueTotal ?? 0

  return [
    {
      label: t('metrics.leadsActive.label'),
      value: String(activeLeads.length),
      caption: t('metrics.leadsActive.caption', { count: leadsCreatedToday }),
      tone: 'success',
    },
    {
      label: t('metrics.visitsMonth.label'),
      value: String(visitEvents.length),
      caption: t('metrics.visitsMonth.caption', { count: visitsToday }),
      tone: 'success',
    },
    {
      label: t('metrics.proposals.label'),
      value: String(pendingOpportunities.length),
      caption: t('metrics.proposals.caption', { count: awaitingResponse }),
      tone: awaitingResponse > 0 ? 'danger' : 'success',
    },
    {
      label: t('metrics.revenue.label'),
      value: formatCurrency(monthlyReceivable),
      caption:
        overdueTotal > 0
          ? t('metrics.revenue.caption', { amount: formatCurrency(overdueTotal) })
          : undefined,
      tone: overdueTotal > 0 ? 'danger' : 'success',
    },
  ]
}
