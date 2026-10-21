'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type {
  AgendaWeekCalendarProps,
  AgendaCalendarCard,
  AgendaEvent,
} from '../../types/agenda-event'
import { buildAgendaTimeline } from '../../utils/build-agenda-timeline'
import { buildAgendaEventSegments, layoutAgendaCards } from '../../utils/layout-agenda-events'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaOrganizationCard } from './AgendaOrganizationCard'
import {
  agendaEventToneStyles,
  getEventEndTime,
  getEventHeight,
  getEventOffsetTop,
  getAgendaCardPlacementSx,
  scheduleHourHeight,
} from './agenda-dashboard-shared'

export function AgendaWeekCalendar({
  days,
  events,
  onSelectEvent,
  timeSlots,
  organizationItems = [],
}: AgendaWeekCalendarProps) {
  const t = useTranslations('agenda.dashboard')
  const organizationT = useTranslations('agenda.organization')
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? '')
  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? days[0]
  const eventSegments = useMemo(() => buildAgendaEventSegments(days, events), [days, events])
  const { itemsByDay, firstHour, calendarTimeSlots, hasAllDayItems } = buildAgendaTimeline(
    days,
    organizationItems,
    timeSlots,
    eventSegments,
  )
  const selectedDayItems = itemsByDay[selectedDay?.key ?? '']?.items ?? []
  const timelineHeight = calendarTimeSlots.length * scheduleHourHeight
  const selectedDayEvents = useMemo(
    () => eventSegments[selectedDay?.key ?? ''] ?? [],
    [eventSegments, selectedDay?.key],
  )
  const selectEvent = (event: AgendaEvent) =>
    onSelectEvent(events.find((original) => original.id === event.id) ?? event)
  const firstAvailableSlot = calendarTimeSlots.find((slot) => {
    const slotStart = slot.hour * 60
    const overlaps = (time: string, duration: number) => {
      const [hour, minute] = time.split(':').map(Number)
      const start = hour * 60 + minute
      return start < slotStart + 60 && start + duration > slotStart
    }
    return (
      !selectedDayEvents.some((event) => overlaps(event.time, event.durationMinutes)) &&
      !selectedDayItems.some((item) => item.time && overlaps(item.time, 60))
    )
  })

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
            {t('selectedDayLabel', {
              date: selectedDay.dateLabel,
              day: selectedDay.dayLabel,
              month: selectedDay.monthLongLabel,
            })}
          </Typography>
        ) : null}

        <Stack spacing={1.2} sx={{ mt: 1.6 }}>
          {selectedDayItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '48px minmax(0, 1fr)',
                gap: 1,
                alignItems: 'stretch',
              }}
            >
              <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 900, pt: 1 }}>
                {item.time ?? organizationT('allDay')}
              </Typography>
              <AgendaOrganizationCard item={item} />
            </Box>
          ))}
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
                  aria-label={t('openEventAriaLabel', { title: event.title })}
                  onClick={() => selectEvent(event)}
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
        role="region"
        aria-label={t('title')}
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

        {hasAllDayItems && (
          <>
            <Typography
              sx={{
                color: brand.neutral[500],
                fontSize: 11,
                fontWeight: 800,
                borderTop: '1px solid',
                borderColor: alpha.graphite[8],
                p: 1.2,
              }}
            >
              {organizationT('allDay')}
            </Typography>
            {days.map((day) => (
              <Stack
                key={`all-day-${day.key}`}
                spacing={0.8}
                sx={{
                  p: 1,
                  borderTop: '1px solid',
                  borderLeft: '1px solid',
                  borderColor: alpha.graphite[8],
                  minWidth: 0,
                }}
              >
                {itemsByDay[day.key].allDayItems.map((item) => (
                  <AgendaOrganizationCard key={item.id} item={item} />
                ))}
              </Stack>
            ))}
          </>
        )}

        <Box
          sx={{
            position: 'relative',
            height: timelineHeight,
            borderTop: '1px solid',
            borderColor: alpha.graphite[8],
          }}
        >
          {calendarTimeSlots.map((slot, index) => (
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

        {days.map((day) => {
          const cards: AgendaCalendarCard[] = [
            ...(eventSegments[day.key] ?? []).map((event) => ({
              kind: 'event' as const,
              event,
              id: `event-${event.id}`,
              top: getEventOffsetTop(event.time, firstHour),
              height: getEventHeight(event.durationMinutes),
            })),
            ...itemsByDay[day.key].timedItems.map((item) => ({
              kind: 'organization' as const,
              item,
              id: item.id,
              top: getEventOffsetTop(item.time!, firstHour),
              height: 64,
            })),
          ]
          return (
            <Box
              key={`timeline-${day.key}`}
              sx={{
                position: 'relative',
                height: timelineHeight,
                borderTop: '1px solid',
                borderLeft: '1px solid',
                borderColor: alpha.graphite[8],
                backgroundImage: `linear-gradient(${alpha.graphite[6]} 1px, ${surface.paper} 1px)`,
                backgroundSize: `100% ${scheduleHourHeight}px`,
              }}
            >
              {layoutAgendaCards(cards).map((card) =>
                card.kind === 'event' ? (
                  <AgendaEventCard
                    key={card.id}
                    event={card.event}
                    height={card.height}
                    onSelect={selectEvent}
                    top={card.top}
                    lane={card.lane}
                    laneCount={card.laneCount}
                  />
                ) : (
                  <Box
                    key={card.id}
                    sx={{
                      ...getAgendaCardPlacementSx(card.top, card.height, card.lane, card.laneCount),
                      '& > a': { height: '100%', boxSizing: 'border-box' },
                    }}
                  >
                    <AgendaOrganizationCard item={card.item} />
                  </Box>
                ),
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
