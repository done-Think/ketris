'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius, shadows } from '@shared/theme/tokens'

import type { AgendaEventCardProps } from '../../types/agenda-event'
import { agendaEventToneStyles } from './agenda-dashboard-shared'

export function AgendaEventCard({ event, height, onSelect, top }: AgendaEventCardProps) {
  const t = useTranslations('agenda.dashboard')
  const tone = agendaEventToneStyles[event.tone]

  return (
    <Box
      component="button"
      type="button"
      aria-label={t('openEventAriaLabel', { title: event.title })}
      onClick={() => onSelect(event)}
      sx={{
        position: 'absolute',
        top,
        left: { xs: 8, md: 16 },
        right: { xs: 8, md: 16 },
        minHeight: height,
        border: 0,
        borderLeft: '3px solid',
        borderColor: tone.borderColor,
        borderRadius: `${radius.sm}px`,
        bgcolor: tone.bgcolor,
        px: 1.1,
        py: 0.8,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        '&:hover, &:focus-visible': {
          boxShadow: shadows.crmCardHover,
          transform: 'translateY(-1px)',
          outline: 'none',
        },
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
