'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, surface } from '@shared/theme/tokens'

import type { AgendaEventCardProps } from '../../types/agenda-event'
import {
  agendaCardBaseSx,
  agendaEventToneStyles,
  getAgendaCardPlacementSx,
} from './agenda-dashboard-shared'

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
      sx={{
        ...agendaCardBaseSx,
        ...getAgendaCardPlacementSx(top, height, lane, laneCount),
        borderColor: tone.borderColor,
        bgcolor: surface.paper,
        backgroundImage: `linear-gradient(${tone.bgcolor}, ${tone.bgcolor})`,
        cursor: 'pointer',
      }}
    >
      <Typography noWrap sx={{ color: tone.color, fontSize: 12, fontWeight: 900 }}>
        {event.time} - {event.title}
      </Typography>
      <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 11, fontWeight: 700 }}>
        {event.participant} - {event.property}
      </Typography>
    </Box>
  )
}
