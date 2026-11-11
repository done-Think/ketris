'use client'

import { styles } from '../../styles/agenda-event-card.styles'

import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

import type { AgendaEventCardProps } from '../../types/agenda-event'
import { agendaEventToneStyles } from '../../styles/agenda-calendar.styles'
import { getAgendaEventPresentation } from '../../utils/agenda-event-outcome'

export function AgendaEventCard({
  event,
  height,
  onSelect,
  top,
  lane = 0,
  laneCount = 1,
}: AgendaEventCardProps) {
  const t = useTranslations('agenda.dashboard')
  const statusT = useTranslations('agenda.eventDetail.statuses')
  const { displayStatus, tone: toneKey, StatusIcon } = getAgendaEventPresentation(event, dayjs())
  const tone = agendaEventToneStyles[toneKey]

  return (
    <Box
      component="button"
      type="button"
      aria-label={
        StatusIcon
          ? t('openEventWithStatusAriaLabel', {
              title: event.title,
              status: statusT(displayStatus),
            })
          : t('openEventAriaLabel', { title: event.title })
      }
      onClick={() => onSelect(event)}
      sx={styles.box(top, height, lane, laneCount, tone)}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" sx={styles.titleRow}>
        {StatusIcon ? <StatusIcon aria-hidden sx={styles.statusIcon(tone)} /> : null}
        <Typography noWrap sx={styles.typography(tone, event.status === 'NO_SHOW')}>
          {event.time} - {event.title}
        </Typography>
      </Stack>
      <Typography noWrap sx={styles.typography2}>
        {event.participant} - {event.property}
      </Typography>
    </Box>
  )
}
