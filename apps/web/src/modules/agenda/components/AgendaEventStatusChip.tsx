import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'

import { agendaDisplayStatusIcons, agendaDisplayStatusTones } from '../config/agenda-event-status'
import { agendaEventToneStyles } from '../styles/agenda-calendar.styles'
import { getAgendaEventStatusChipStyles } from '../styles/agenda-event-status-chip.styles'
import type { AgendaEventStatusChipProps } from '../types/agenda-event'

export function AgendaEventStatusChip({ status }: AgendaEventStatusChipProps) {
  const t = useTranslations('agenda.eventDetail.statuses')
  const Icon = agendaDisplayStatusIcons[status]

  return (
    <Chip
      size="small"
      label={t(status)}
      icon={Icon ? <Icon /> : undefined}
      sx={getAgendaEventStatusChipStyles(agendaEventToneStyles[agendaDisplayStatusTones[status]])}
    />
  )
}
