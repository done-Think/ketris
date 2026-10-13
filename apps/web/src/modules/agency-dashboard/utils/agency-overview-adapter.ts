import { formatCurrency, formatDate } from '@shared/lib/utils/format'

import type {
  AgencyActivity,
  AgencyActivityTone,
  AgencyOverviewKpi,
  AgencyRevenuePoint,
  AgencyTopBroker,
} from '../types/agency-overview'
import type {
  ApiAgencyActivity,
  ApiAgencyActivityType,
  ApiAgencyOverview,
  ApiAgencyOverviewKpis,
  ApiAgencyRevenueMonth,
  ApiAgencyTopBroker,
} from '../types/service'

const monthAbbreviations = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const activityTypeToTone: Record<ApiAgencyActivityType, AgencyActivityTone> = {
  CONTRACT: 'contract',
  PROPERTY: 'property',
  VISIT: 'visit',
  LEAD: 'lead',
}

type KpiComparison = Pick<AgencyOverviewKpi, 'helper' | 'tone'>

function getNewPropertiesComparison(newPropertiesCount: number): KpiComparison {
  return {
    helper: { key: 'newProperties', values: { count: newPropertiesCount } },
    tone: newPropertiesCount > 0 ? 'success' : 'neutral',
  }
}

function getLeadsComparison(current: number, previous: number): KpiComparison {
  const difference = current - previous

  if (difference > 0) {
    return { helper: { key: 'leadsIncrease', values: { count: difference } }, tone: 'success' }
  }

  if (difference < 0) {
    return { helper: { key: 'leadsDecrease', values: { count: -difference } }, tone: 'neutral' }
  }

  return { helper: { key: 'leadsSame' }, tone: 'neutral' }
}

function getRevenueComparison(current: number, previous: number): KpiComparison {
  if (previous <= 0) {
    return current > 0
      ? { helper: { key: 'revenueNoPrevious' }, tone: 'neutral' }
      : { tone: 'neutral' }
  }

  // Rounds away from zero symmetrically, so +0.5% and −0.5% are both reported (Math.round(-0.5) is -0).
  const change = ((current - previous) / previous) * 100
  const percent = Math.sign(change) * Math.round(Math.abs(change))

  if (percent > 0) {
    return { helper: { key: 'revenueIncrease', values: { percent } }, tone: 'success' }
  }

  if (percent < 0) {
    return { helper: { key: 'revenueDecrease', values: { percent: -percent } }, tone: 'neutral' }
  }

  return { helper: { key: 'revenueSame' }, tone: 'neutral' }
}

export function mapKpisToAgencyOverviewKpis(kpis: ApiAgencyOverviewKpis): AgencyOverviewKpi[] {
  return [
    {
      id: 'portfolio',
      labelKey: 'portfolio',
      value: String(kpis.portfolioCount),
      ...getNewPropertiesComparison(kpis.newPropertiesThisMonth),
    },
    {
      id: 'brokers',
      labelKey: 'activeBrokers',
      value: String(kpis.activeBrokersCount),
      tone: 'neutral',
    },
    {
      id: 'leads',
      labelKey: 'receivedLeads',
      value: String(kpis.receivedLeadsThisMonth),
      ...getLeadsComparison(kpis.receivedLeadsThisMonth, kpis.receivedLeadsPreviousPeriod),
    },
    {
      id: 'revenue',
      labelKey: 'revenue',
      value: formatCurrency(kpis.monthlyReceivable),
      ...getRevenueComparison(kpis.monthlyReceivable, kpis.monthlyReceivablePreviousMonth),
    },
    {
      id: 'occupancy',
      labelKey: 'occupancy',
      value: `${kpis.occupancyPercentage}%`,
      tone: 'neutral',
      progress: kpis.occupancyPercentage,
    },
  ]
}

export function mapRevenueSeriesToAgencyRevenuePoints(
  series: ApiAgencyRevenueMonth[],
): AgencyRevenuePoint[] {
  return series.map((entry) => ({
    month: monthAbbreviations[entry.month - 1] ?? String(entry.month),
    revenue: entry.total,
  }))
}

export function mapTopBrokersToAgencyTopBrokers(
  topBrokers: ApiAgencyTopBroker[],
): AgencyTopBroker[] {
  return topBrokers.map((broker) => ({
    id: broker.id,
    name: broker.name,
    profileId: broker.id,
    hasPublicProfile: broker.hasPublicProfile,
    sales: broker.salesCount,
    revenue: formatCurrency(broker.revenueTotal),
    avatarUrl: broker.avatarUrl,
    recentSales: broker.recentSales.map((sale) => ({
      id: sale.id,
      propertyId: sale.propertyId,
      property: sale.propertyTitle,
      location: sale.location,
      value: formatCurrency(sale.value),
      closedAt: formatDate(sale.closedAt),
    })),
  }))
}

export function mapActivitiesToAgencyActivities(activities: ApiAgencyActivity[]): AgencyActivity[] {
  return activities.map((activity) => ({
    id: activity.id,
    broker: activity.brokerName,
    detail: activity.detail,
    occurredAtLabel: formatDate(activity.occurredAt, 'DD/MM/YYYY HH:mm'),
    tone: activityTypeToTone[activity.type],
  }))
}

export function mapAgencyOverviewToUi(overview: ApiAgencyOverview) {
  return {
    kpis: mapKpisToAgencyOverviewKpis(overview.kpis),
    revenuePoints: mapRevenueSeriesToAgencyRevenuePoints(overview.revenueSeries),
    topBrokers: mapTopBrokersToAgencyTopBrokers(overview.topBrokers),
    activities: mapActivitiesToAgencyActivities(overview.recentActivities),
  }
}
