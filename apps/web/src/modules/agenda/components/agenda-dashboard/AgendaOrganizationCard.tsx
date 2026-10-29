'use client'

import { styles } from '../../styles/agenda-organization-card.styles'

import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import type { AgendaOrganizationCardProps } from '../../types/agenda-organization'
import { agendaEventToneStyles } from '../../styles/agenda-calendar.styles'

export function AgendaOrganizationCard({ item }: AgendaOrganizationCardProps) {
  const t = useTranslations('agenda.organization')
  const formatter = useFormatter()
  const tone =
    agendaEventToneStyles[
      item.kind === 'charge' ? 'warning' : item.kind === 'ticketOpened' ? 'info' : 'primary'
    ]
  const status =
    item.kind === 'charge' ? t(`chargeStatuses.${item.status}`) : t(`ticketStatuses.${item.status}`)

  return (
    <Box
      component={Link}
      href={
        item.kind === 'charge'
          ? { pathname: '/dashboard/finance/charges/[id]', params: { id: item.sourceId } }
          : { pathname: '/dashboard/maintenance/[id]', params: { id: item.sourceId } }
      }
      sx={styles.box(tone)}
    >
      <Typography noWrap sx={styles.typography(tone)}>
        {t(`kinds.${item.kind}`)} · {item.time ?? t('allDay')}
      </Typography>
      <Typography noWrap sx={styles.typography2}>
        {item.title}
      </Typography>
      <Typography noWrap sx={styles.typography3}>
        {status}
        {item.amount !== undefined
          ? ` · ${formatter.number(item.amount, { style: 'currency', currency: 'BRL' })}`
          : item.property
            ? ` · ${item.property}`
            : ''}
      </Typography>
    </Box>
  )
}
