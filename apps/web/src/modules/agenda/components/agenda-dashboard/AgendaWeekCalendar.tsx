'use client'

import { Box, Stack, Typography } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgendaWeekCalendarProps } from '../../types/agenda-event'
import { AgendaEventCard } from './AgendaEventCard'
import {
  getEventHeight,
  getEventOffsetTop,
  scheduleHourHeight,
  scheduleTimelineHeight,
} from './agenda-dashboard-shared'

export function AgendaWeekCalendar({
  days,
  events,
  onSelectEvent,
  timeSlots,
}: AgendaWeekCalendarProps) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmDetailPanel,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '48px repeat(5, minmax(132px, 1fr))',
            md: '72px repeat(5, minmax(0, 1fr))',
          },
          overflowX: 'auto',
        }}
      >
        <Box sx={{ minHeight: 78 }} />
        {days.map((day) => (
          <Stack
            key={day.key}
            alignItems="center"
            justifyContent="center"
            spacing={0.6}
            sx={{ minHeight: 78 }}
          >
            <Typography
              sx={{
                color: day.today ? brand.magenta[500] : brand.graphite[500],
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {day.dayLabel} {day.dateLabel}
            </Typography>
            {day.today ? (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: radius.full,
                  bgcolor: brand.magenta[500],
                }}
              />
            ) : null}
          </Stack>
        ))}

        <Box
          sx={{
            position: 'relative',
            height: scheduleTimelineHeight,
            borderTop: '1px solid',
            borderColor: alpha.graphite[8],
          }}
        >
          {timeSlots.map((slot, index) => (
            <Typography
              key={slot.label}
              sx={{
                position: 'absolute',
                top: index * scheduleHourHeight + 14,
                left: { xs: 8, md: 18 },
                color: brand.neutral[500],
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {slot.label}
            </Typography>
          ))}
        </Box>

        {days.map((day) => (
          <Box
            key={`timeline-${day.key}`}
            sx={{
              position: 'relative',
              height: scheduleTimelineHeight,
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderColor: alpha.graphite[8],
              backgroundImage: `linear-gradient(${alpha.graphite[6]} 1px, ${surface.paper} 1px)`,
              backgroundSize: `100% ${scheduleHourHeight}px`,
            }}
          >
            {events
              .filter((event) => event.scheduledDate === day.key)
              .map((event) => (
                <AgendaEventCard
                  key={event.id}
                  event={event}
                  height={getEventHeight(event.durationMinutes)}
                  onSelect={onSelectEvent}
                  top={getEventOffsetTop(event.time)}
                />
              ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
