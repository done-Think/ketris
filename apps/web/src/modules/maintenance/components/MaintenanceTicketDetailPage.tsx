'use client'

import * as maintenanceStyles from '../styles/maintenance-ticket-detail-page.styles'

import { Link } from '@/i18n/navigation'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useMaintenanceTicket } from '../hooks/use-maintenance'
import type { MaintenanceTicketDetailPageProps } from '../types/maintenance'
import {
  mapMaintenancePriorityFromApi,
  mapMaintenanceStatusFromApi,
} from '../utils/maintenance-adapter'
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

  const isRenter = session?.role === 'RENTER'

  const ticketQuery = useMaintenanceTicket(ticketId)

  const ticket = ticketQuery.data

  if (!ticket && ticketQuery.isLoading) {
    return (
      <Box sx={maintenanceStyles.boxSx}>
        <Typography sx={maintenanceStyles.typographySx}>{detailT('loading')}</Typography>
      </Box>
    )
  }

  if (!ticket) {
    const notFound =
      axios.isAxiosError(ticketQuery.error) && ticketQuery.error.response?.status === 404
    return (
      <Box sx={maintenanceStyles.boxSx}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography sx={maintenanceStyles.typographySx2}>
            {notFound ? detailT('notFound.title') : detailT('loadError')}
          </Typography>
          {!notFound && <Button onClick={() => ticketQuery.refetch()}>{detailT('retry')}</Button>}
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
    <Box sx={maintenanceStyles.boxSx}>
      <Stack spacing={2.2} sx={maintenanceStyles.stackSx}>
        {ticketQuery.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => ticketQuery.refetch()}>{detailT('retry')}</Button>}
          >
            {detailT('loadError')}
          </Alert>
        )}
        <Box component={Link} href="/dashboard/maintenance" sx={maintenanceStyles.boxSx2}>
          <ArrowBackRoundedIcon sx={maintenanceStyles.arrowBackRoundedIconSx} />
          {detailT('back')}
        </Box>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ lg: 'center' }}
        >
          <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1.4} useFlexGap>
            <Typography sx={maintenanceStyles.typographySx3}>{ticket.id}</Typography>
            <Box sx={maintenanceStyles.boxSx3} />
            <Typography sx={maintenanceStyles.typographySx4}>{ticket.title}</Typography>
            <Chip
              label={t(`statuses.${status}`)}
              size="small"
              sx={maintenanceStyles.getChipSx(status)}
            />
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Box sx={maintenanceStyles.getBoxSx(priority)} />
              <Typography sx={maintenanceStyles.typographySx5}>
                {t(`priorities.${priority}`)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Box sx={maintenanceStyles.boxSx4}>
          <MaintenanceWorkflowControls ticket={ticket} />
          <MaintenanceSchedule key={ticket.id} ticket={ticket} />
        </Box>
        {isRenter && ticket.status === 'AWAITING_CONFIRMATION' && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.resolutionNotice')}
          </Typography>
        )}
        {isRenter && ticket.status === 'RESOLVED' && !ticket.deletedAt && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.resolvedNotice')}
          </Typography>
        )}
        {isRenter && ['CANCELED', 'CLOSED'].includes(ticket.status) && (
          <Typography variant="body2" color="text.secondary">
            {t('renter.readOnlyNotice')}
          </Typography>
        )}
        <Box sx={maintenanceStyles.boxSx5}>
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
