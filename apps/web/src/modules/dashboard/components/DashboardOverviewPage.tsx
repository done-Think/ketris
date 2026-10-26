'use client'

import { useMemo, useState } from 'react'
import { Box, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'

import {
  AgencyExchangeRateNotice,
  AgencyOverviewKpiGrid,
  AgencyRecentActivityPanel,
  AgencyRevenuePerformancePanel,
  AgencyTopBrokersPanel,
  useAgencyOverviewUi,
} from '@modules/agency-dashboard'

import { useDashboardOverview } from '../hooks/use-dashboard-overview'
import type { DashboardRecentLead, DashboardUpcomingActivity } from '../types/dashboard-overview'
import type { ApiDashboardMetrics } from '../types/service'
import { buildDashboardMetrics } from '../utils/build-dashboard-metrics'
import { toDashboardUpcomingActivity } from '../utils/map-dashboard-activity'
import { toDashboardRecentLead } from '../utils/map-dashboard-lead'
import { ActivityDetailModal } from './ActivityDetailModal'
import { DashboardMetricGrid } from './DashboardMetricGrid'
import { LeadDetailsModal } from './LeadDetailsModal'
import { RecentLeadsTable } from './RecentLeadsTable'
import { UpcomingActivitiesPanel } from './UpcomingActivitiesPanel'

const emptyMetrics: ApiDashboardMetrics = {
  activeLeads: 0,
  activeLeadsCreatedToday: 0,
  visitsThisMonth: 0,
  visitsToday: 0,
  openProposals: 0,
  proposalsAwaitingResponse: 0,
}

const twoColumns = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
  gap: 1.6,
  alignItems: 'stretch',
} as const

function formatDashboardDate(locale: string, date = new Date()) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date)

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

// The single dashboard of the CRM, adapted to the signed-in role. Every user sees their own work
// (leads, visits, proposals, upcoming activities); the agency's owners and admins also see the
// agency-wide numbers (portfolio, brokers, revenue, top brokers and team activity). The API
// enforces the same split: agency data answers 403 to agents.
export function DashboardOverviewPage() {
  const locale = useLocale()
  const t = useTranslations('dashboard.overview')
  const currentDate = formatDashboardDate(locale)
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const userId = session?.user?.id
  const isAgencyManager = session?.role === 'OWNER'
  const [selectedActivity, setSelectedActivity] = useState<DashboardUpcomingActivity | null>(null)
  const [selectedLead, setSelectedLead] = useState<DashboardRecentLead | null>(null)

  const overviewQuery = useDashboardOverview(tenantId, userId)
  const agency = useAgencyOverviewUi(tenantId, isAgencyManager)

  const recentLeads = useMemo(
    () => (overviewQuery.data?.recentLeads ?? []).map(toDashboardRecentLead),
    [overviewQuery.data],
  )
  const upcomingActivities = useMemo(
    () => (overviewQuery.data?.upcomingActivities ?? []).map(toDashboardUpcomingActivity),
    [overviewQuery.data],
  )
  const metrics = useMemo(
    () => buildDashboardMetrics({ metrics: overviewQuery.data?.metrics ?? emptyMetrics, t }),
    [overviewQuery.data, t],
  )

  const upcomingActivitiesPanel = (
    <UpcomingActivitiesPanel
      activities={upcomingActivities}
      onActivitySelect={setSelectedActivity}
    />
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={currentDate}
          actions={
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <DashboardNotificationsButton />
            </Box>
          }
        />

        {isAgencyManager ? (
          <>
            <AgencyExchangeRateNotice
              targetCurrency={agency.targetCurrency}
              exchangeRate={agency.exchangeRate}
              isPending={agency.isExchangeRatePending}
            />
            <AgencyOverviewKpiGrid kpis={agency.overview?.kpis ?? []} />
          </>
        ) : null}

        <DashboardMetricGrid metrics={metrics} />

        {isAgencyManager ? (
          <>
            <Box sx={twoColumns}>
              <AgencyRevenuePerformancePanel
                revenuePoints={agency.overview?.revenuePoints ?? []}
                currency={agency.displayCurrency}
              />
              <AgencyTopBrokersPanel topBrokers={agency.overview?.topBrokers ?? []} />
            </Box>
            <Box sx={twoColumns}>
              <AgencyRecentActivityPanel activities={agency.overview?.activities ?? []} />
              {upcomingActivitiesPanel}
            </Box>
          </>
        ) : (
          upcomingActivitiesPanel
        )}

        <RecentLeadsTable leads={recentLeads} onLeadSelect={setSelectedLead} />
      </Stack>

      <ActivityDetailModal
        activity={selectedActivity}
        tenantId={tenantId}
        onClose={() => setSelectedActivity(null)}
      />
      <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </Box>
  )
}
