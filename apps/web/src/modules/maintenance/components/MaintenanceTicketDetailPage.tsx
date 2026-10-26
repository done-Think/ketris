'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand } from '@shared/theme/tokens'

import { useMaintenanceTicket } from '../hooks/use-maintenance'
import type { MaintenanceTicketDetailPageProps } from '../types/maintenance'
import {
  mapMaintenancePriorityFromApi,
  mapMaintenanceStatusFromApi,
} from '../utils/maintenance-adapter'
import { statusStyles, priorityColors } from '../utils/maintenance-presentation'
import { MaintenanceSchedule } from './MaintenanceSchedule'
import { MaintenanceWorkflowControls } from './MaintenanceWorkflowControls'
import { MaintenanceTicketAttachments } from './ticket-detail/MaintenanceTicketAttachments'
import { MaintenanceTicketDescription } from './ticket-detail/MaintenanceTicketDescription'
import { MaintenanceTicketInformation } from './ticket-detail/MaintenanceTicketInformation'
import { MaintenanceTicketTimeline } from './ticket-detail/MaintenanceTicketTimeline'

export function MaintenanceTicketDetailPage({ ticketId }: MaintenanceTicketDetailPageProps) {
  const t = useTranslations('dashboard.maintenance')

  const detailT = useTranslations('dashboard.maintenance.detail')

  const { data: session } = useSession()

  const tenantId = session?.tenantId

  const isRenter = session?.role === 'RENTER'

  const ticketQuery = useMaintenanceTicket(tenantId, ticketId)

  const ticket = ticketQuery.data

  if (ticketQuery.isLoading) {
    return (
      <Box sx={{ width: '100%', p: 3.5 }}>
        <Typography sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 700 }}>
          {detailT('loading')}
        </Typography>
      </Box>
    )
  }

  if (!ticket) {
    return (
      <Box sx={{ width: '100%', p: 3.5 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography sx={{ color: brand.graphite[500], fontSize: 24, fontWeight: 900 }}>
            {detailT('notFound.title')}
          </Typography>
          <Button component={Link} href="/dashboard/maintenance" variant="outlined">
            {detailT('notFound.action')}
          </Button>
        </Stack>
      </Box>
    )
  }

  const status = mapMaintenanceStatusFromApi(ticket.status)

  const priority = mapMaintenancePriorityFromApi(ticket.priority)

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.2} sx={{ width: '100%' }}>
        <Box
          component={Link}
          href="/dashboard/maintenance"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.55,
            width: 'fit-content',
            color: brand.neutral[600],
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
          {detailT('back')}
        </Box>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ lg: 'center' }}
        >
          <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1.4} useFlexGap>
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 21, md: 24 }, fontWeight: 900 }}
            >
              {ticket.id}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: brand.neutral[500] }} />
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 18, md: 20 }, fontWeight: 900 }}
            >
              {ticket.title}
            </Typography>
            <Chip
              label={t(`statuses.${status}`)}
              size="small"
              sx={{
                height: 21,
                ...statusStyles[status],
                fontSize: 10,
                fontWeight: 900,
              }}
            />
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: priorityColors[priority],
                }}
              />
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
                {t(`priorities.${priority}`)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.5fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <MaintenanceWorkflowControls ticket={ticket} />
          <MaintenanceSchedule ticket={ticket} />
        </Box>
        {isRenter && ticket.status === 'AGUARDANDO_CONFIRMACAO' && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.resolutionNotice')}
          </Typography>
        )}
        {isRenter && ticket.status === 'RESOLVIDO' && !ticket.deletedAt && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.resolvedNotice')}
          </Typography>
        )}
        {isRenter && ['CANCELADO', 'FECHADO'].includes(ticket.status) && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.readOnlyNotice')}
          </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(300px, 1fr)' },
            gap: 2,
          }}
        >
          <Stack spacing={2}>
            <MaintenanceTicketDescription ticket={ticket} />
            <MaintenanceTicketAttachments ticket={ticket} />
            <MaintenanceTicketTimeline ticket={ticket} />
          </Stack>
          <Stack spacing={2}>
            <MaintenanceTicketInformation ticket={ticket} />
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
