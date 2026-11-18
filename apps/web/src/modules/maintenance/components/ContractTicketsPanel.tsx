'use client'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { finishedContractTicketStatuses } from '../config/contract-ticket-statuses'
import { useContractMaintenanceTickets } from '../hooks/use-maintenance'
import { getTicketStatusChipStyles, styles } from '../styles/contract-tickets-panel.styles'
import type { ContractTicketsPanelProps } from '../types/maintenance'
import { mapMaintenanceTicketListItemFromApi } from '../utils/maintenance-adapter'
import { formatMaintenanceCategory } from '../utils/maintenance-category'

export function ContractTicketsPanel({ contractId }: ContractTicketsPanelProps) {
  const t = useTranslations('dashboard.maintenance')
  const formatter = useFormatter()
  const query = useContractMaintenanceTickets(contractId)
  const tickets = (query.data ?? [])
    .map((item) =>
      mapMaintenanceTicketListItemFromApi(item, (value) =>
        formatter.dateTime(new Date(value), { dateStyle: 'short' }),
      ),
    )
    .filter((ticket) => !finishedContractTicketStatuses.has(ticket.status))

  return (
    <Box sx={styles.panel}>
      <Stack direction="row" alignItems="center" spacing={1} useFlexGap sx={styles.header}>
        <Typography component="h2" sx={styles.title}>
          {t('contractTickets.title')}
        </Typography>
        <MuiLink
          component={Link}
          href="/dashboard/maintenance"
          underline="hover"
          sx={styles.openAll}
        >
          {t('contractTickets.openAll')}
        </MuiLink>
      </Stack>
      {query.isPending && <CircularProgress size={24} />}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
        >
          {t('listError')}
        </Alert>
      )}
      {query.isSuccess && !tickets.length && (
        <Typography sx={styles.empty}>{t('contractTickets.empty')}</Typography>
      )}
      {tickets.map((ticket) => (
        <Stack key={ticket.id} direction="row" alignItems="center" spacing={1.5} sx={styles.ticket}>
          <Box sx={styles.ticketText}>
            <MuiLink
              component={Link}
              href={{ pathname: '/dashboard/maintenance/[id]', params: { id: ticket.id } }}
              underline="hover"
              sx={styles.ticketTitle}
            >
              {ticket.title}
            </MuiLink>
            <Typography sx={styles.meta}>
              {t('contractTickets.meta', {
                category: formatMaintenanceCategory(ticket.category, (key) =>
                  t(`categories.${key}`),
                ),
                date: ticket.openedAt,
                name: ticket.tenant,
              })}
            </Typography>
          </Box>
          <Chip
            label={t(`statuses.${ticket.status}`)}
            size="small"
            sx={getTicketStatusChipStyles(ticket.status)}
          />
        </Stack>
      ))}
    </Box>
  )
}
