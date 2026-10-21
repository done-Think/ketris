'use client'

import { Box, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand } from '@shared/theme/tokens'
import type { AgendaOrganizationCardProps } from '../../types/agenda-organization'
import { agendaCardBaseSx, agendaEventToneStyles } from './agenda-dashboard-shared'

export function AgendaOrganizationCard({ item }: AgendaOrganizationCardProps) {
  const t = useTranslations('agenda.organization')
  const locale = useLocale()
  const tone =
    agendaEventToneStyles[
      item.kind === 'charge' ? 'warning' : item.kind === 'ticketOpened' ? 'info' : 'primary'
    ]
  const status = t(`${item.kind === 'charge' ? 'chargeStatuses' : 'ticketStatuses'}.${item.status}`)

  return (
    <Box
      component={Link}
      href={
        item.kind === 'charge'
          ? { pathname: '/dashboard/finance/charges/[id]', params: { id: item.sourceId } }
          : { pathname: '/dashboard/maintenance/[id]', params: { id: item.sourceId } }
      }
      sx={{
        ...agendaCardBaseSx,
        display: 'block',
        borderColor: tone.borderColor,
        bgcolor: tone.bgcolor,
        textDecoration: 'none',
      }}
    >
      <Typography noWrap sx={{ color: tone.color, fontSize: 10, fontWeight: 800 }}>
        {t(`kinds.${item.kind}`)} · {item.time ?? t('allDay')}
      </Typography>
      <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 900 }}>
        {item.title}
      </Typography>
      <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
        {status}
        {item.amount !== undefined
          ? ` · ${new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(item.amount)}`
          : item.property
            ? ` · ${item.property}`
            : ''}
      </Typography>
    </Box>
  )
}
