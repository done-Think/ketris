import dayjs from 'dayjs'
import type {
  AgendaCalendarDay,
  AgendaCalendarCard,
  AgendaEvent,
  AgendaHourRow,
  AgendaTimeSlot,
} from '../types/agenda-event'
import type { AgendaOrganizationItem } from '../types/agenda-organization'

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

export function buildAgendaHourRows(
  days: AgendaCalendarDay[],
  timeSlots: AgendaTimeSlot[],
  eventsByDay: Record<string, AgendaEvent[]>,
  organizationItems: AgendaOrganizationItem[],
): AgendaHourRow[] {
  const rows = timeSlots.map((slot) => ({
    ...slot,
    cardsByDay: Object.fromEntries(days.map((day) => [day.key, [] as AgendaCalendarCard[]])),
  }))
  const rowsByHour = new Map(rows.map((row) => [row.hour, row]))
  for (const day of days) {
    for (const event of eventsByDay[day.key] ?? []) {
      const hour = Number(event.time.split(':')[0])
      rowsByHour.get(hour)?.cardsByDay[day.key].push({
        kind: 'event',
        id: `event-${event.id}`,
        time: event.time,
        event,
      })
    }
  }
  for (const item of organizationItems) {
    if (!item.time) continue
    const hour = Number(item.time.split(':')[0])
    rowsByHour.get(hour)?.cardsByDay[item.date]?.push({
      kind: 'organization',
      id: item.id,
      time: item.time,
      item,
    })
  }
  for (const row of rows) {
    for (const cards of Object.values(row.cardsByDay)) {
      cards.sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
    }
  }
  return rows
}
