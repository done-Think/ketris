import type { BuildDashboardMetricsParams, DashboardMetric } from '../types/dashboard-overview'

// The API already counts in the business time zone and scopes by role (an AGENT only gets their
// own work); this only turns the counts into the cards.
export function buildDashboardMetrics({
  metrics,
  t,
}: BuildDashboardMetricsParams): DashboardMetric[] {
  return [
    {
      label: t('metrics.leadsActive.label'),
      value: String(metrics.activeLeads),
      caption: t('metrics.leadsActive.caption', { count: metrics.activeLeadsCreatedToday }),
      tone: 'success',
    },
    {
      label: t('metrics.visitsMonth.label'),
      value: String(metrics.visitsThisMonth),
      caption: t('metrics.visitsMonth.caption', { count: metrics.visitsToday }),
      tone: 'success',
    },
    {
      label: t('metrics.proposals.label'),
      value: String(metrics.openProposals),
      caption: t('metrics.proposals.caption', { count: metrics.proposalsAwaitingResponse }),
      tone: metrics.proposalsAwaitingResponse > 0 ? 'danger' : 'success',
    },
  ]
}
