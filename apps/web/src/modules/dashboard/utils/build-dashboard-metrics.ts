import dayjs from 'dayjs'

import type { BuildDashboardMetricsParams, DashboardMetric } from '../types/dashboard-overview'

// Operational metrics of the signed-in user's work. Leads and opportunities already come scoped
// by the API (an AGENT only gets their own); revenue is on the agency KPIs, for owners/admins.
export function buildDashboardMetrics({
  leads,
  opportunities,
  monthEvents,
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
  ]
}
