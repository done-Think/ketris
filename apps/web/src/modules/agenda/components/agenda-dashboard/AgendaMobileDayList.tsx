'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgendaEvent, AgendaMobileDayListProps } from '../../types/agenda-event'
import { agendaEventToneStyles } from './agenda-dashboard-shared'

function getEventEndTime(event: AgendaEvent) {
  const [hour = 0, minute = 0] = event.time.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute + event.durationMinutes, 0, 0)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AgendaMobileDayList({
  days,
  events,
  onSelectDay,
  onSelectEvent,
  selectedDayKey,
}: AgendaMobileDayListProps) {
  const t = useTranslations('agenda.dashboard')
  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? days[0]
  const selectedEvents = events
    .filter((event) => event.scheduledDate === selectedDay?.key)
    .sort((firstEvent, secondEvent) => firstEvent.time.localeCompare(secondEvent.time))

  if (!selectedDay) return null

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          gap: 0.8,
          mb: 2,
          width: '100%',
        }}
      >
        {days.map((day) => {
          const selected = day.key === selectedDay.key

          return (
            <Box
              key={day.key}
              component="button"
              type="button"
              onClick={() => onSelectDay(day.key)}
              sx={{
                display: 'grid',
                placeItems: 'center',
                gap: 0.3,
                width: '100%',
                minHeight: 58,
                border: 0,
                borderRadius: `${radius.sm}px`,
                bgcolor: selected ? brand.magenta[500] : undefined,
                color: selected ? surface.lightText : brand.neutral[500],
                cursor: 'pointer',
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>{day.dayLabel}</Typography>
              <Typography sx={{ color: 'inherit', fontSize: 14, fontWeight: 900 }}>
                {day.dateLabel}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Typography sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900, mb: 1.4 }}>
        {t('selectedDayLabel', {
          date: selectedDay.dateLabel,
          day: selectedDay.dayLabel,
          month: selectedDay.monthLongLabel,
        })}
      </Typography>

      <Stack spacing={1.2} sx={{ width: '100%' }}>
        {selectedEvents.length === 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', gap: 1.2 }}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 900 }}>
              09:00
            </Typography>
            <Box
              sx={{
                border: '1px dashed',
                borderColor: alpha.graphite[10],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                px: 1.4,
                py: 1.4,
              }}
            >
              <Typography sx={{ color: brand.neutral[400], fontSize: 13, fontWeight: 700 }}>
                {t('freeSlot')}
              </Typography>
            </Box>
          </Box>
        ) : (
          selectedEvents.map((event) => {
            const tone = agendaEventToneStyles[event.tone]

            return (
              <Box
                key={event.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '48px minmax(0, 1fr)',
                  gap: 1.2,
                  width: '100%',
                }}
              >
                <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 900 }}>
                  {event.time}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  aria-label={t('openEventAriaLabel', { title: event.title })}
                  onClick={() => onSelectEvent(event)}
                  sx={{
                    display: 'grid',
                    gap: 0.4,
                    width: '100%',
                    border: 0,
                    borderLeft: '4px solid',
                    borderColor: tone.borderColor,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                    boxShadow: shadows.crmCardCompact,
                    px: 1.4,
                    py: 1.2,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                      {event.title}
                    </Typography>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                      {event.time} - {getEventEndTime(event)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                    {event.participant}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[400], fontSize: 12, fontWeight: 700 }}>
                    {event.property}
                  </Typography>
                </Box>
              </Box>
            )
          })
        )}
      </Stack>
    </Box>
  )
}
