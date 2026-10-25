'use client'

import { styles } from '../../styles/agenda-week-calendar.styles'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type {
  AgendaWeekCalendarProps,
  AgendaCalendarCard,
  AgendaEvent,
} from '../../types/agenda-event'
import { buildAgendaTimeline } from '../../utils/build-agenda-timeline'
import { buildAgendaEventSegments, layoutAgendaCards } from '../../utils/layout-agenda-events'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaOrganizationCard } from './AgendaOrganizationCard'
import { agendaEventToneStyles } from '../../styles/agenda-calendar.styles'
import {
  getEventEndTime,
  getEventHeight,
  getEventOffsetTop,
  scheduleHourHeight,
} from '../../utils/agenda-calendar'

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
  const selectedDay =
    days.find((day) => day.key === selectedDayKey) ?? days.find((day) => day.today) ?? days[0]
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

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Box sx={styles.box3(days)}>
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
                sx={styles.box4(selected)}
              >
                <Typography sx={styles.typography}>{day.dayLabel}</Typography>
                <Typography sx={styles.typography2}>{day.dateLabel}</Typography>
              </Box>
            )
          })}
        </Box>

        {selectedDay ? (
          <Typography sx={styles.typography3}>
            {t('selectedDayLabel', {
              date: selectedDay.dateLabel,
              day: selectedDay.dayLabel,
              month: selectedDay.monthLongLabel,
            })}
          </Typography>
        ) : null}

        <Stack spacing={1.2} sx={styles.stack}>
          {selectedDayItems.map((item) => (
            <Box key={item.id} sx={styles.box5}>
              <Typography sx={styles.typography4}>
                {item.time ?? organizationT('allDay')}
              </Typography>
              <AgendaOrganizationCard item={item} />
            </Box>
          ))}
          {firstAvailableSlot ? (
            <Box sx={styles.box6}>
              <Typography sx={styles.typography5}>{firstAvailableSlot.label}</Typography>
              <Box sx={styles.box7}>{t('freeSlot')}</Box>
            </Box>
          ) : null}

          {selectedDayEvents.map((event) => {
            const tone = agendaEventToneStyles[event.tone]

            return (
              <Box key={event.id} sx={styles.box8}>
                <Typography sx={styles.typography6}>{event.time}</Typography>
                <Box
                  component="button"
                  type="button"
                  aria-label={t('openEventAriaLabel', { title: event.title })}
                  onClick={() => selectEvent(event)}
                  sx={styles.box9(tone)}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography sx={styles.typography7}>
                      {event.title} - {event.property}
                    </Typography>
                    <Typography sx={styles.typography8}>
                      {event.time} - {getEventEndTime(event)}
                    </Typography>
                  </Stack>
                  <Typography sx={styles.typography9}>{event.participant}</Typography>
                  <Typography sx={styles.typography10}>{event.notes}</Typography>
                </Box>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box role="region" aria-label={t('title')} sx={styles.box10(days)}>
        <Box sx={styles.box11} />
        {days.map((day) => (
          <Stack
            key={day.key}
            alignItems="center"
            justifyContent="center"
            spacing={0.6}
            sx={styles.stack2}
          >
            <Typography sx={styles.typography11(day)}>
              {day.dayLabel} {day.dateLabel}
            </Typography>
            {day.today ? <Box sx={styles.box12} /> : null}
          </Stack>
        ))}

        {hasAllDayItems && (
          <>
            <Typography sx={styles.typography12}>{organizationT('allDay')}</Typography>
            {days.map((day) => (
              <Stack key={`all-day-${day.key}`} spacing={0.8} sx={styles.stack3}>
                {itemsByDay[day.key].allDayItems.map((item) => (
                  <AgendaOrganizationCard key={item.id} item={item} />
                ))}
              </Stack>
            ))}
          </>
        )}

        <Box sx={styles.box13(timelineHeight)}>
          {calendarTimeSlots.map((slot, index) => (
            <Typography key={slot.label} sx={styles.typography13(index)}>
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
            <Box key={`timeline-${day.key}`} sx={styles.box14(timelineHeight)}>
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
                  <Box key={card.id} sx={styles.box15(card)}>
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
