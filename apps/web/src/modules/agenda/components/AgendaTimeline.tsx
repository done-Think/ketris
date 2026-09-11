import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

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

function getEventEndTime(event: { durationMinutes: number; scheduledDate: string; time: string }) {
  return dayjs(`${event.scheduledDate}T${event.time}`)
    .add(event.durationMinutes, 'minute')
    .format('HH:mm')
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
  const t = useTranslations('dashboard.agenda')
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? '')
  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? days[0]
  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((event) => event.scheduledDate === selectedDay?.key)
        .sort((firstEvent, secondEvent) => firstEvent.time.localeCompare(secondEvent.time)),
    [events, selectedDay?.key],
  )
  const firstAvailableSlot = agendaTimeSlots.find(
    (slot) => !selectedDayEvents.some((event) => event.time.startsWith(slot.label)),
  )

  useEffect(() => {
    const today = days.find((day) => day.today)

    setSelectedDayKey((currentDayKey) => {
      if (days.some((day) => day.key === currentDayKey)) return currentDayKey

      return today?.key ?? days[0]?.key ?? ''
    })
  }, [days])

  return (
    <Box
      sx={{
        bgcolor: { xs: surface.app, md: surface.paper },
        border: { xs: 0, md: '1px solid' },
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: { xs: shadows.none, md: shadows.crmDetailPanel },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: { xs: 'block', md: 'none' }, px: 1.6, py: 1.8 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            gap: 0.8,
          }}
        >
          {days.map((day) => {
            const selected = day.key === selectedDay?.key

            return (
              <Box
                key={day.key}
                component="button"
                type="button"
                aria-pressed={selected}
                aria-label={`${day.dayLabel}, ${day.dateLabel} ${day.monthLabel}`}
                onClick={() => setSelectedDayKey(day.key)}
                sx={{
                  border: 0,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: selected ? brand.magenta[500] : surface.app,
                  color: selected ? surface.paper : brand.neutral[500],
                  cursor: 'pointer',
                  minHeight: 54,
                  px: 0.8,
                  py: 0.7,
                }}
              >
                <Typography sx={{ display: 'block', fontSize: 11, fontWeight: 700 }}>
                  {day.dayLabel}
                </Typography>
                <Typography sx={{ display: 'block', fontSize: 14, fontWeight: 900 }}>
                  {day.dateLabel}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {selectedDay ? (
          <Typography
            sx={{
              color: brand.graphite[500],
              fontSize: 18,
              fontWeight: 900,
              mt: 2.2,
            }}
          >
            {selectedDay.dayLabel}, {selectedDay.dateLabel} de {selectedDay.monthLongLabel}
          </Typography>
        ) : null}

        <Stack spacing={1.2} sx={{ mt: 1.6 }}>
          {firstAvailableSlot ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '48px minmax(0, 1fr)',
                gap: 1,
                alignItems: 'stretch',
              }}
            >
              <Typography sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 900, pt: 1 }}>
                {firstAvailableSlot.label}
              </Typography>
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: alpha.graphite[8],
                  borderRadius: `${radius.sm}px`,
                  color: brand.neutral[400],
                  fontSize: 13,
                  fontWeight: 700,
                  px: 1.4,
                  py: 1.2,
                }}
              >
                {t('freeSlot')}
              </Box>
            </Box>
          ) : null}

          {selectedDayEvents.map((event) => {
            const tone = agendaEventToneStyles[event.tone]

            return (
              <Box
                key={event.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '48px minmax(0, 1fr)',
                  gap: 1,
                  alignItems: 'stretch',
                }}
              >
                <Typography
                  sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 900, pt: 2 }}
                >
                  {event.time}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  aria-label={`Abrir ${event.title}`}
                  onClick={() => onEventSelect(event)}
                  sx={{
                    border: 0,
                    borderLeft: '4px solid',
                    borderColor: tone.borderColor,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                    boxShadow: shadows.crmCardCompact,
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 0.4,
                    px: 1.4,
                    py: 1.4,
                    textAlign: 'left',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                      {event.title} - {event.property}
                    </Typography>
                    <Typography
                      sx={{
                        color: brand.neutral[500],
                        flex: '0 0 auto',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {event.time} - {getEventEndTime(event)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
                    {event.participant}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[400], fontSize: 11, fontWeight: 700 }}>
                    {event.notes}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: {
            xs: `48px repeat(${days.length}, minmax(132px, 1fr))`,
            md: `72px repeat(${days.length}, minmax(0, 1fr))`,
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
