import { mapMonthlySeriesToMovement } from '@shared/lib/currency/monthly-series'
import { formatCurrency, formatDate } from '@shared/lib/utils/format'
import { defaultTimeZone } from '@/i18n/formats'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

import type {
  AgencyActivity,
  AgencyActivityTone,
  AgencyOverviewKpi,
  AgencyRevenuePoint,
  AgencyTopBroker,
  AgencyOverviewView,
  KpiComparison,
} from '../types/agency-overview'
import type {
  ApiAgencyActivity,
  ApiAgencyActivityType,
  ApiAgencyOverview,
  ApiAgencyOverviewKpis,
  ApiAgencyRevenueMonth,
  ApiAgencyTopBroker,
} from '../types/agency-service'

const activityTypeToTone: Record<ApiAgencyActivityType, AgencyActivityTone> = {
  CONTRACT: 'contract',
  PROPERTY: 'property',
  VISIT: 'visit',
  LEAD: 'lead',
}

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

export function mapKpisToAgencyOverviewKpis(
  kpis: ApiAgencyOverviewKpis,
  locale: AppLocale = defaultLocale,
): AgencyOverviewKpi[] {
  const formatNumber = new Intl.NumberFormat(locale).format

  return [
    {
      id: 'portfolio',
      labelKey: 'portfolio',
      value: formatNumber(kpis.portfolioCount),
      ...getNewPropertiesComparison(kpis.newPropertiesThisMonth),
    },
    {
      id: 'brokers',
      labelKey: 'activeBrokers',
      value: formatNumber(kpis.activeBrokersCount),
      tone: 'neutral',
    },
    {
      id: 'leads',
      labelKey: 'receivedLeads',
      value: formatNumber(kpis.receivedLeadsThisMonth),
      ...getLeadsComparison(kpis.receivedLeadsThisMonth, kpis.receivedLeadsPreviousPeriod),
    },
    {
      id: 'revenue',
      labelKey: 'revenue',
      value: formatCurrency(kpis.monthlyReceivable, locale),
      ...getRevenueComparison(kpis.monthlyReceivable, kpis.monthlyReceivablePreviousMonth),
    },
    {
      id: 'overdue',
      labelKey: 'overdue',
      value: formatCurrency(kpis.overdueTotal, locale),
      helper: { key: kpis.overdueTotal > 0 ? 'overdue' : 'noOverdue' },
      tone: kpis.overdueTotal > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'occupancy',
      labelKey: 'occupancy',
      value: `${formatNumber(kpis.occupancyPercentage)}%`,
      tone: 'neutral',
      progress: kpis.occupancyPercentage,
    },
  ]
}

export function mapRevenueSeriesToAgencyRevenuePoints(
  series: ApiAgencyRevenueMonth[],
  locale: AppLocale = defaultLocale,
): AgencyRevenuePoint[] {
  return mapMonthlySeriesToMovement(series, locale)
}

export function mapTopBrokersToAgencyTopBrokers(
  topBrokers: ApiAgencyTopBroker[],
  locale: AppLocale = defaultLocale,
): AgencyTopBroker[] {
  return topBrokers.map((broker) => ({
    id: broker.id,
    name: broker.name,
    profileId: broker.id,
    hasPublicProfile: broker.hasPublicProfile,
    sales: broker.salesCount,
    revenue: formatCurrency(broker.revenueTotal, locale),
    avatarUrl: broker.avatarUrl,
    recentSales: broker.recentSales.map((sale) => ({
      id: sale.id,
      propertyId: sale.propertyId,
      property: sale.propertyTitle,
      location: sale.location,
      value: formatCurrency(sale.value, locale),
      closedAt: formatDate(sale.closedAt, undefined, locale),
    })),
  }))
}

export function mapActivitiesToAgencyActivities(
  activities: ApiAgencyActivity[],
  locale: AppLocale = defaultLocale,
): AgencyActivity[] {
  const formatDateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: defaultTimeZone,
  }).format

  return activities.map((activity) => ({
    id: activity.id,
    broker: activity.brokerName,
    detail: activity.detail,
    occurredAtLabel: formatDateTime(new Date(activity.occurredAt)),
    tone: activityTypeToTone[activity.type],
  }))
}

export function mapAgencyOverviewToUi(
  overview: ApiAgencyOverview,
  locale: AppLocale = defaultLocale,
): AgencyOverviewView {
  return {
    kpis: mapKpisToAgencyOverviewKpis(overview.kpis, locale),
    revenuePoints: mapRevenueSeriesToAgencyRevenuePoints(overview.revenueSeries, locale),
    topBrokers: mapTopBrokersToAgencyTopBrokers(overview.topBrokers, locale),
    activities: mapActivitiesToAgencyActivities(overview.recentActivities, locale),
  }
}
