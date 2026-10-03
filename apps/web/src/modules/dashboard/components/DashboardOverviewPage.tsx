'use client'

import { useMemo, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { brand } from '@shared/theme/tokens'

import { useAgendaEvents } from '@modules/agenda/hooks/use-agenda-events'
import { useLeads } from '@modules/crm/hooks/use-leads'
import { useOpportunities } from '@modules/crm/hooks/use-opportunities'
import { useFinancialSummary } from '@modules/financial/hooks/use-financial'

import type { DashboardRecentLead, DashboardUpcomingActivity } from '../types/dashboard-overview'
import { buildDashboardMetrics } from '../utils/build-dashboard-metrics'
import { buildDashboardPerformance } from '../utils/build-dashboard-performance'
import { toDashboardUpcomingActivity } from '../utils/map-dashboard-activity'
import { toDashboardRecentLead } from '../utils/map-dashboard-lead'
import { ActivityDetailModal } from './ActivityDetailModal'
import { DashboardMetricGrid } from './DashboardMetricGrid'
import { DashboardPanel } from './DashboardPanel'
import { DashboardPerformanceChart } from './DashboardPerformanceChart'
import { LeadDetailsModal } from './LeadDetailsModal'
import { RecentLeadsTable } from './RecentLeadsTable'
import { UpcomingActivitiesPanel } from './UpcomingActivitiesPanel'

const recentLeadsLimit = 5
const upcomingActivitiesLimit = 5

function formatDashboardDate(locale: string, date = new Date()) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date)

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

export function DashboardOverviewPage() {
  const locale = useLocale()
  const t = useTranslations('dashboard.overview')
  const currentDate = formatDashboardDate(locale)
  const { data: session } = useSession()
  const tenantId = session?.tenantId
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
  const financialSummaryQuery = useFinancialSummary(tenantId)

  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data])
  const opportunities = useMemo(() => opportunitiesQuery.data ?? [], [opportunitiesQuery.data])
  const monthEvents = useMemo(
    () => (monthEventsQuery.data ?? []).filter((event) => event.status !== 'CANCELLED'),
    [monthEventsQuery.data],
  )
  const financialSummary = financialSummaryQuery.data

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
        .filter((event) => !dayjs(event.start).isBefore(today))
        .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
        .slice(0, upcomingActivitiesLimit)
        .map(toDashboardUpcomingActivity),
    [monthEvents, today],
  )

  const metrics = useMemo(
    () => buildDashboardMetrics({ leads, opportunities, monthEvents, financialSummary, today, t }),
    [leads, opportunities, monthEvents, financialSummary, today, t],
  )

  const performanceData = useMemo(
    () => buildDashboardPerformance(financialSummary?.monthlySeries ?? []),
    [financialSummary],
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

        <DashboardMetricGrid metrics={metrics} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
            gap: 1.6,
          }}
        >
          <DashboardPanel>
            <Box
              sx={{
                display: 'flex',
                minHeight: { xs: 330, md: 360 },
                flexDirection: 'column',
                p: { xs: 2, md: 2.4 },
              }}
            >
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                {t('performanceTitle')}
              </Typography>
              <DashboardPerformanceChart data={performanceData} />
            </Box>
          </DashboardPanel>

          <UpcomingActivitiesPanel
            activities={upcomingActivities}
            onActivitySelect={setSelectedActivity}
          />
        </Box>

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
