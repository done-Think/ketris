import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { layoutAgendaCards, buildAgendaEventSegments } from '../../utils/layout-agenda-events'
import { buildAgendaCalendarDays } from '../../components/agenda-dashboard/agenda-dashboard-shared'
import { buildAgendaTimeline } from '../../utils/build-agenda-timeline'
import { agendaTimeSlots } from '../../data/agenda-events'
import type { AgendaEvent } from '../../types/agenda-event'

describe('overlapping agenda cards', () => {
  it('exposes a different lane for each simultaneous card', () => {
    const cards = layoutAgendaCards(
      ['one', 'two', 'three'].map((id) => ({ id, top: 100, height: 62 })),
    )
    expect(new Set(cards.map((card) => card.lane)).size).toBe(3)
    expect(cards.every((card) => card.laneCount === 3)).toBe(true)
  })
  it('reuses lanes after an event ends and keeps separate periods at full width', () => {
    const cards = layoutAgendaCards([
      { id: 'long', top: 0, height: 120 },
      { id: 'first', top: 30, height: 30 },
      { id: 'second', top: 60, height: 30 },
      { id: 'separate', top: 120, height: 60 },
    ])
    expect(cards.find((card) => card.id === 'first')?.lane).toBe(
      cards.find((card) => card.id === 'second')?.lane,
    )
    expect(cards.find((card) => card.id === 'separate')).toMatchObject({ lane: 0, laneCount: 1 })
  })
  it('accounts for the actual card height, including cards taller than short bookings', () => {
    const cards = layoutAgendaCards([
      { id: 'one', top: 0, height: 38 },
      { id: 'two', top: 31, height: 38 },
    ])
    expect(cards[0].lane).not.toBe(cards[1].lane)
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
