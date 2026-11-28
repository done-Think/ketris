import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildAgendaHourRows, buildAgendaEventSegments } from '../../utils/layout-agenda-events'
import { buildAgendaCalendarDays } from '../../utils/agenda-calendar'
import { buildAgendaTimeline } from '../../utils/build-agenda-timeline'
import { agendaTimeSlots } from '../../config/agenda-scheduling'
import type { AgendaEvent } from '../../types/agenda-event'
import type { AgendaOrganizationItem } from '../../types/agenda-organization'
import { agendaEventFixture } from '../fixtures/agenda-event'

describe('adaptive agenda hour rows', () => {
  const days = buildAgendaCalendarDays(dayjs('2031-03-01'), 'pt-BR')

  it('keeps every simultaneous booking in its hour without losing dense groups', () => {
    const events = Array.from({ length: 50 }, (_, index) =>
      agendaEventFixture({ id: `event-${index}`, scheduledDate: days[0].key, time: '09:30' }),
    )
    const rows = buildAgendaHourRows(days, agendaTimeSlots, { [days[0].key]: events }, [])
    const busy = rows.find((row) => row.hour === 9)!
    expect(busy.cardsByDay[days[0].key]).toHaveLength(50)
    expect(new Set(busy.cardsByDay[days[0].key].map((card) => card.id)).size).toBe(50)
    expect(busy.cardsByDay[days[1].key]).toEqual([])
    expect(rows.find((row) => row.hour === 10)?.cardsByDay[days[0].key]).toEqual([])
    expect(events[0].durationMinutes).toBe(60)
  })

  it('sorts timed items and bookings together while keeping all-day items outside the grid', () => {
    const events = [
      agendaEventFixture({ id: 'later', time: '09:45' }),
      agendaEventFixture({ id: 'earlier', time: '09:00' }),
      agendaEventFixture({ id: 'long', time: '10:30', durationMinutes: 150 }),
    ]
    const ticket: AgendaOrganizationItem = {
      id: 'ticket',
      sourceId: 'ticket-1',
      kind: 'ticketScheduled',
      date: days[0].key,
      time: '09:30',
      title: 'Repair',
      property: 'Apartment',
      status: 'OPEN',
    }
    const allDay: AgendaOrganizationItem = {
      id: 'charge',
      sourceId: 'charge-1',
      kind: 'charge',
      date: days[0].key,
      title: 'Rent',
      property: 'Apartment',
      status: 'PENDING',
    }
    const rows = buildAgendaHourRows(days, agendaTimeSlots, { [days[0].key]: events }, [
      ticket,
      allDay,
    ])
    expect(
      rows.find((row) => row.hour === 9)?.cardsByDay[days[0].key].map((card) => card.id),
    ).toEqual(['event-earlier', 'ticket', 'event-later'])
    const long = rows.find((row) => row.hour === 10)?.cardsByDay[days[0].key][0]
    expect(long?.kind === 'event' && long.event.durationMinutes).toBe(150)
    expect(events[0].id).toBe('later')
    expect(
      rows
        .flatMap((row) => Object.values(row.cardsByDay).flat())
        .some((card) => card.id === 'charge'),
    ).toBe(false)
  })
})

it('splits overnight events across visible days and extends the hourly grid', () => {
  const days = buildAgendaCalendarDays(dayjs('2031-03-01'), 'pt-BR')
  const event = {
    id: 'night',
    scheduledDate: days[0].key,
    time: '23:30',
    durationMinutes: 90,
  } as AgendaEvent
  const segments = buildAgendaEventSegments(days, [event])
  expect(segments[days[0].key][0]).toMatchObject({ time: '23:30', durationMinutes: 30 })
  expect(segments[days[1].key][0]).toMatchObject({ time: '00:00', durationMinutes: 60 })
  expect(event.durationMinutes).toBe(90)
  const timeline = buildAgendaTimeline(days, [], agendaTimeSlots, segments)
  expect(timeline.firstHour).toBe(0)
  expect(timeline.calendarTimeSlots.at(-1)?.hour).toBe(23)
})
