'use client'

import { styles } from '../../styles/agenda-week-calendar.styles'

import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'

import type { AgendaWeekCalendarProps, AgendaEvent } from '../../types/agenda-event'
import { buildAgendaTimeline } from '../../utils/build-agenda-timeline'
import { buildAgendaEventSegments, buildAgendaHourRows } from '../../utils/layout-agenda-events'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaOrganizationCard } from './AgendaOrganizationCard'
import { agendaEventToneStyles } from '../../styles/agenda-calendar.styles'
import { getAgendaEventPresentation } from '../../utils/agenda-event-outcome'
import { getEventEndTime } from '../../utils/agenda-calendar'

export function AgendaWeekCalendar({
  days,
  events,
  onSelectEvent,
  timeSlots,
  organizationItems = [],
}: AgendaWeekCalendarProps) {
  const t = useTranslations('agenda.dashboard')
  const organizationT = useTranslations('agenda.organization')
  const statusT = useTranslations('agenda.eventDetail.statuses')
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? '')
  const selectedDay =
    days.find((day) => day.key === selectedDayKey) ?? days.find((day) => day.today) ?? days[0]
  const eventSegments = useMemo(() => buildAgendaEventSegments(days, events), [days, events])
  const { itemsByDay, calendarTimeSlots, hasAllDayItems } = buildAgendaTimeline(
    days,
    organizationItems,
    timeSlots,
    eventSegments,
  )
  const selectedDayItems = itemsByDay[selectedDay?.key ?? '']?.items ?? []
  const hourRows = buildAgendaHourRows(days, calendarTimeSlots, eventSegments, organizationItems)
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
            const {
              displayStatus,
              tone: toneKey,
              StatusIcon,
            } = getAgendaEventPresentation(event, dayjs())
            const tone = agendaEventToneStyles[toneKey]

            return (
              <Box key={event.id} sx={styles.box8}>
                <Typography sx={styles.typography6}>{event.time}</Typography>
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
                  onClick={() => selectEvent(event)}
                  sx={styles.box9(tone)}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Stack direction="row" spacing={0.6} alignItems="flex-start">
                      {StatusIcon ? <StatusIcon aria-hidden sx={styles.statusIcon(tone)} /> : null}
                      <Typography sx={styles.typography7}>
                        {event.title} - {event.property}
                      </Typography>
                    </Stack>
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

        {hourRows.map((row) => (
          <Fragment key={row.hour}>
            <Typography sx={styles.hourLabel}>{row.label}</Typography>
            {days.map((day) => (
              <Box key={day.key} sx={styles.hourCell}>
                {row.cardsByDay[day.key].map((card) =>
                  card.kind === 'event' ? (
                    <AgendaEventCard key={card.id} event={card.event} onSelect={selectEvent} />
                  ) : (
                    <AgendaOrganizationCard key={card.id} item={card.item} />
                  ),
                )}
              </Box>
            ))}
          </Fragment>
        ))}
      </Box>
    </Box>
  )
}
