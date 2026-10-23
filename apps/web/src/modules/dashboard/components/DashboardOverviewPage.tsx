'use client'

import { useMemo, useState } from 'react'
import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
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
import { useAgendaEvents } from '@modules/agenda/hooks/use-agenda-events'
import type { AgendaEventApi } from '@modules/agenda/types/agenda-event'
import { useLeads } from '@modules/crm/hooks/use-leads'
import { useOpportunities } from '@modules/crm/hooks/use-opportunities'

import type { DashboardRecentLead, DashboardUpcomingActivity } from '../types/dashboard-overview'
import { buildDashboardMetrics } from '../utils/build-dashboard-metrics'
import { toDashboardUpcomingActivity } from '../utils/map-dashboard-activity'
import { toDashboardRecentLead } from '../utils/map-dashboard-lead'
import { ActivityDetailModal } from './ActivityDetailModal'
import { DashboardMetricGrid } from './DashboardMetricGrid'
import { LeadDetailsModal } from './LeadDetailsModal'
import { RecentLeadsTable } from './RecentLeadsTable'
import { UpcomingActivitiesPanel } from './UpcomingActivitiesPanel'

const recentLeadsLimit = 5
const upcomingActivitiesLimit = 5

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
  const isAgent = session?.role === 'AGENT'
  const isAgencyManager = session?.role === 'ADMIN' || session?.role === 'OWNER'
  const [selectedActivity, setSelectedActivity] = useState<DashboardUpcomingActivity | null>(null)
  const [selectedLead, setSelectedLead] = useState<DashboardRecentLead | null>(null)

  const today = useMemo(() => dayjs(), [])
  const monthStart = useMemo(() => today.startOf('month'), [today])
  const monthEnd = useMemo(() => today.endOf('month'), [today])

  const leadsQuery = useLeads(tenantId)
  const opportunitiesQuery = useOpportunities(tenantId)
  const monthEventsQuery = useAgendaEvents(
    tenantId,
    monthStart.toISOString(),
    monthEnd.toISOString(),
  )
  const agency = useAgencyOverviewUi(tenantId, isAgencyManager)

  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data])
  const opportunities = useMemo(() => opportunitiesQuery.data ?? [], [opportunitiesQuery.data])
  const monthEvents = useMemo(
    () =>
      (monthEventsQuery.data ?? []).filter(
        (event): event is AgendaEventApi =>
          event.status !== 'CANCELLED' && 'participantName' in event,
      ),
    [monthEventsQuery.data],
  )

  const metricEvents = useMemo(
    () =>
      monthEvents.filter(
        (event) =>
          isAgencyManager || (event.responsibleId === userId && event.audience !== 'ALL_AGENTS'),
      ),
    [monthEvents, isAgencyManager, userId],
  )

  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
        .slice(0, recentLeadsLimit)
        .map(toDashboardRecentLead),
    [leads],
  )

  const upcomingActivities = useMemo(
    () =>
      monthEvents
        .filter(
          (event) =>
            isAgencyManager ||
            event.responsibleId === userId ||
            (isAgent && event.audience === 'ALL_AGENTS'),
        )
        .filter((event) => !dayjs(event.start).isBefore(today))
        .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
        .slice(0, upcomingActivitiesLimit)
        .map(toDashboardUpcomingActivity),
    [monthEvents, today, isAgencyManager, isAgent, userId],
  )

  const metrics = useMemo(
    () => buildDashboardMetrics({ leads, opportunities, monthEvents: metricEvents, today, t }),
    [leads, opportunities, metricEvents, today, t],
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
