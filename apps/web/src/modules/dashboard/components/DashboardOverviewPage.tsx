'use client'

import { Box, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'

import { emptyDashboardMetrics } from '../config/dashboard-metrics'
import { useAgencyOverview } from '../hooks/use-agency-overview'
import { useDashboardOverview } from '../hooks/use-dashboard-overview'
import type { DashboardRecentLead, DashboardUpcomingActivity } from '../types/dashboard-overview'
import { buildDashboardMetrics } from '../utils/build-dashboard-metrics'
import { formatDashboardDate } from '../utils/format-dashboard-date'
import { ActivityDetailModal } from './ActivityDetailModal'
import { AgencyExchangeRateNotice } from './AgencyExchangeRateNotice'
import { AgencyOverviewKpiGrid } from './AgencyOverviewKpiGrid'
import { AgencyRecentActivityPanel } from './AgencyRecentActivityPanel'
import { AgencyRevenuePerformancePanel } from './AgencyRevenuePerformancePanel'
import { AgencyTopBrokersPanel } from './AgencyTopBrokersPanel'
import { DashboardMetricGrid } from './DashboardMetricGrid'
import { LeadDetailsModal } from './LeadDetailsModal'
import { RecentLeadsTable } from './RecentLeadsTable'
import { UpcomingActivitiesPanel } from './UpcomingActivitiesPanel'
import { styles } from '../styles/dashboard-overview-page.styles'

export function DashboardOverviewPage() {
  const locale = useLocale()
  const t = useTranslations('dashboard.overview')
  const { data: session } = useSession()
  const isAgencyManager = session?.role === 'OWNER'
  const [selectedActivity, setSelectedActivity] = useState<DashboardUpcomingActivity | null>(null)
  const [selectedLead, setSelectedLead] = useState<DashboardRecentLead | null>(null)

  const overview = useDashboardOverview().data
  const agency = useAgencyOverview(isAgencyManager)
  const metrics = buildDashboardMetrics({ metrics: overview?.metrics ?? emptyDashboardMetrics, t })

  const upcomingActivitiesPanel = (
    <UpcomingActivitiesPanel
      activities={overview?.upcomingActivities ?? []}
      onActivitySelect={setSelectedActivity}
    />
  )

  return (
    <Box sx={styles.page}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={formatDashboardDate(locale)}
          actions={
            <Box sx={styles.desktopOnly}>
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
            <Box sx={styles.twoColumns}>
              <AgencyRevenuePerformancePanel
                revenuePoints={agency.overview?.revenuePoints ?? []}
                currency={agency.displayCurrency}
              />
              <AgencyTopBrokersPanel topBrokers={agency.overview?.topBrokers ?? []} />
            </Box>
            <Box sx={styles.twoColumns}>
              <AgencyRecentActivityPanel activities={agency.overview?.activities ?? []} />
              {upcomingActivitiesPanel}
            </Box>
          </>
        ) : (
          upcomingActivitiesPanel
        )}

        <RecentLeadsTable leads={overview?.recentLeads ?? []} onLeadSelect={setSelectedLead} />
      </Stack>

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </Box>
  )
}
