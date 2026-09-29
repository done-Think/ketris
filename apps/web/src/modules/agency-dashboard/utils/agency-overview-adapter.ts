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

export function mapKpisToAgencyOverviewKpis(kpis: ApiAgencyOverviewKpis): AgencyOverviewKpi[] {
  return [
    {
      id: 'portfolio',
      labelKey: 'portfolio',
      value: String(kpis.portfolioCount),
      helper: '',
      tone: 'neutral',
    },
    {
      id: 'brokers',
      labelKey: 'activeBrokers',
      value: String(kpis.activeBrokersCount),
      helper: '',
      tone: 'neutral',
    },
    {
      id: 'leads',
      labelKey: 'receivedLeads',
      value: String(kpis.receivedLeadsThisMonth),
      helper: '',
      tone: 'neutral',
    },
    {
      id: 'revenue',
      labelKey: 'revenue',
      value: formatCurrency(kpis.monthlyReceivable),
      helper: '',
      tone: 'neutral',
    },
    {
      id: 'occupancy',
      labelKey: 'occupancy',
      value: `${kpis.occupancyPercentage}%`,
      helper: '',
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
