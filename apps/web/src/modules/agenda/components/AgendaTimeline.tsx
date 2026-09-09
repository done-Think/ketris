import { Box, Stack, Typography } from '@mui/material'

import { alpha, brand, radius, shadows, supportColor, surface } from '@shared/theme/tokens'

import { agendaTimeSlots } from '../data/agenda-events'
import type {
  AgendaEventCardProps,
  AgendaEventTone,
  AgendaEventToneStyle,
  AgendaTimelineProps,
} from '../types/agenda-event'

const scheduleStartHour = 8
const scheduleEndHour = 18
const scheduleHourHeight = 62
const scheduleTimelineHeight = (scheduleEndHour - scheduleStartHour + 1) * scheduleHourHeight

const agendaEventToneStyles: Record<AgendaEventTone, AgendaEventToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[10],
    borderColor: brand.magenta[500],
    color: brand.magenta[600],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    borderColor: brand.semantic.info,
    color: brand.semantic.info,
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    borderColor: brand.semantic.warning,
    color: brand.semantic.warning,
  },
}

function getEventOffsetTop(time: string) {
  const [hour = scheduleStartHour, minute = 0] = time.split(':').map(Number)

  return (hour - scheduleStartHour) * scheduleHourHeight + (minute / 60) * scheduleHourHeight
}

function getEventHeight(durationMinutes: number) {
  return Math.max((durationMinutes / 60) * scheduleHourHeight, 38)
}

function AgendaEventCard({ event, height, onSelect, top }: AgendaEventCardProps) {
  const tone = agendaEventToneStyles[event.tone]

  return (
    <Box
      component="button"
      type="button"
      aria-label={`Abrir ${event.title}`}
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

export function AgendaTimeline({ days, events, onEventSelect }: AgendaTimelineProps) {
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
          {agendaTimeSlots.map((slot, index) => (
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
                  onSelect={onEventSelect}
                  top={getEventOffsetTop(event.time)}
                />
              ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
