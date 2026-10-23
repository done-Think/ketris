import {
  formatFinancialAmount,
  type FinancialExchangeRate,
} from '@modules/financial/utils/financial-display-currency'
import { mapMonthlySeriesToMovement } from '@modules/financial/utils/financial-summary-adapter'
import { formatDate } from '@shared/lib/utils/format'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

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

// Money is stored in BRL; like the financial dashboard, it is shown in the locale's currency
// (EUR for es-ES, USD for en-US) when an exchange rate is available, and in BRL otherwise.
export function mapKpisToAgencyOverviewKpis(
  kpis: ApiAgencyOverviewKpis,
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
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
      value: formatFinancialAmount(kpis.monthlyReceivable, locale, exchangeRate),
      ...getRevenueComparison(kpis.monthlyReceivable, kpis.monthlyReceivablePreviousMonth),
    },
    {
      id: 'overdue',
      labelKey: 'overdue',
      value: formatFinancialAmount(kpis.overdueTotal, locale, exchangeRate),
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
  exchangeRate?: FinancialExchangeRate | null,
): AgencyRevenuePoint[] {
  return mapMonthlySeriesToMovement(series, locale, exchangeRate)
}

export function mapTopBrokersToAgencyTopBrokers(
  topBrokers: ApiAgencyTopBroker[],
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
): AgencyTopBroker[] {
  return topBrokers.map((broker) => ({
    id: broker.id,
    name: broker.name,
    profileId: broker.id,
    hasPublicProfile: broker.hasPublicProfile,
    sales: broker.salesCount,
    revenue: formatFinancialAmount(broker.revenueTotal, locale, exchangeRate),
    avatarUrl: broker.avatarUrl,
    recentSales: broker.recentSales.map((sale) => ({
      id: sale.id,
      propertyId: sale.propertyId,
      property: sale.propertyTitle,
      location: sale.location,
      value: formatFinancialAmount(sale.value, locale, exchangeRate),
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

export function mapAgencyOverviewToUi(
  overview: ApiAgencyOverview,
  locale: AppLocale = defaultLocale,
  exchangeRate?: FinancialExchangeRate | null,
) {
  return {
    kpis: mapKpisToAgencyOverviewKpis(overview.kpis, locale, exchangeRate),
    revenuePoints: mapRevenueSeriesToAgencyRevenuePoints(
      overview.revenueSeries,
      locale,
      exchangeRate,
    ),
    topBrokers: mapTopBrokersToAgencyTopBrokers(overview.topBrokers, locale, exchangeRate),
    activities: mapActivitiesToAgencyActivities(overview.recentActivities),
  }
}
