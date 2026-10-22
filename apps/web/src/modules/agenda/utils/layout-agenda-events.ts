import dayjs from 'dayjs'
import type { AgendaCalendarDay, AgendaEvent } from '../types/agenda-event'

export function buildAgendaEventSegments(days: AgendaCalendarDay[], events: AgendaEvent[]) {
  const result: Record<string, AgendaEvent[]> = Object.fromEntries(days.map((day) => [day.key, []]))
  for (const day of days) {
    const dayStart = dayjs(day.key).startOf('day')
    const dayEnd = dayStart.add(1, 'day')
    for (const event of events) {
      const start = dayjs(`${event.scheduledDate}T${event.time}`)
      const end = start.add(event.durationMinutes, 'minute')
      if (!start.isBefore(dayEnd) || !end.isAfter(dayStart)) continue
      const visibleStart = start.isBefore(dayStart) ? dayStart : start
      const visibleEnd = end.isAfter(dayEnd) ? dayEnd : end
      result[day.key].push({
        ...event,
        scheduledDate: day.key,
        time: visibleStart.format('HH:mm'),
        durationMinutes: visibleEnd.diff(visibleStart, 'minute'),
      })
    }
    result[day.key].sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
  }
  return result
}

export function layoutAgendaCards<T extends { id: string; top: number; height: number }>(
  cards: T[],
): (T & { lane: number; laneCount: number })[] {
  const result: (T & { lane: number; laneCount: number })[] = []
  let group: (T & { lane: number })[] = []
  let laneEnds: number[] = []
  let groupEnd = -Infinity
  function flush() {
    result.push(...group.map((card) => ({ ...card, laneCount: laneEnds.length })))
    group = []
    laneEnds = []
    groupEnd = -Infinity
  }
  for (const card of [...cards].sort(
    (a, b) => a.top - b.top || b.height - a.height || a.id.localeCompare(b.id),
  )) {
    if (card.top >= groupEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= card.top)
    if (lane < 0) lane = laneEnds.length
    laneEnds[lane] = card.top + card.height
    groupEnd = Math.max(groupEnd, laneEnds[lane])
    group.push({ ...card, lane })
  }
  flush()
  return result
}
