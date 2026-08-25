'use client'

import { useState } from 'react'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'

import { formatDate } from '@shared/lib/utils/format'
import { alpha, brand, shadows, surface } from '@shared/theme/tokens'

import type {
  DashboardLeadDetailsFormValues,
  DashboardRecentLead,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'
import { useDashboardStore } from '../stores/dashboard-store'
import { ActivityDetailModal } from './ActivityDetailModal'
import { DashboardMetricGrid } from './DashboardMetricGrid'
import { DashboardPanel } from './DashboardPanel'
import { DashboardPerformanceChart } from './DashboardPerformanceChart'
import { LeadDetailsModal } from './LeadDetailsModal'
import { RecentLeadsTable } from './RecentLeadsTable'
import { UpcomingActivitiesPanel } from './UpcomingActivitiesPanel'

function formatDashboardDate(date = new Date()) {
  const formattedDate = formatDate(date, 'dddd, D [de] MMMM YYYY').replace('-feira', '')

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

export function DashboardOverviewPage() {
  const currentDate = formatDashboardDate()
  const leads = useDashboardStore((state) => state.leads)
  const updateLeadDetails = useDashboardStore((state) => state.updateLeadDetails)
  const [selectedActivity, setSelectedActivity] = useState<DashboardUpcomingActivity | null>(null)
  const [selectedLead, setSelectedLead] = useState<DashboardRecentLead | null>(null)

  function handleLeadUpdate(leadName: string, values: DashboardLeadDetailsFormValues) {
    updateLeadDetails(leadName, values)
    setSelectedLead((currentLead) =>
      currentLead?.name === leadName ? { ...currentLead, ...values } : currentLead,
    )
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 3.4 } }}>
      <Stack spacing={2.4}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
              Dashboard
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 600, mt: 0.3 }}>
              {currentDate}
            </Typography>
          </Box>

          <IconButton
            aria-label="Notificações"
            sx={{
              width: 38,
              height: 38,
              bgcolor: surface.paper,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              boxShadow: shadows.crmCardCompact,
              '&:hover': { bgcolor: surface.paper },
            }}
          >
            <NotificationsNoneOutlinedIcon sx={{ color: brand.graphite[500], fontSize: 19 }} />
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: brand.magenta[500],
              }}
            />
          </IconButton>
        </Stack>

        <DashboardMetricGrid />

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
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography
                  sx={{
                    color: brand.neutral[500],
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  Desempenho 6 meses
                </Typography>
                <Typography sx={{ color: brand.magenta[600], fontSize: 11, fontWeight: 900 }}>
                  Meta: 85%
                </Typography>
              </Stack>
              <DashboardPerformanceChart />
            </Box>
          </DashboardPanel>

          <UpcomingActivitiesPanel onActivitySelect={setSelectedActivity} />
        </Box>

        <RecentLeadsTable leads={leads} onLeadSelect={setSelectedLead} />
      </Stack>

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdate={handleLeadUpdate}
      />
    </Box>
  )
}
