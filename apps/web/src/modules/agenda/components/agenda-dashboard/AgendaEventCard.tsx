'use client'

import { styles } from '../../styles/agenda-event-card.styles'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { AgendaEventCardProps } from '../../types/agenda-event'
import { agendaEventToneStyles } from '../../styles/agenda-calendar.styles'

export function AgendaEventCard({
  event,
  height,
  onSelect,
  top,
  lane = 0,
  laneCount = 1,
}: AgendaEventCardProps) {
  const t = useTranslations('agenda.dashboard')
  const tone = agendaEventToneStyles[event.tone]

  return (
    <Box
      component="button"
      type="button"
      aria-label={t('openEventAriaLabel', { title: event.title })}
      onClick={() => onSelect(event)}
      sx={styles.box(top, height, lane, laneCount, tone)}
    >
      <Typography noWrap sx={styles.typography(tone)}>
        {event.time} - {event.title}
      </Typography>
      <Typography noWrap sx={styles.typography2}>
        {event.participant} - {event.property}
      </Typography>
    </Box>
  )
}
