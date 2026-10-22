import type { AgendaCalendarDay, AgendaTimeSlot, AgendaEvent } from '../types/agenda-event'
import type { AgendaOrganizationItem, AgendaTimeline } from '../types/agenda-organization'

export function buildAgendaTimeline(
  days: AgendaCalendarDay[],
  items: AgendaOrganizationItem[],
  timeSlots: AgendaTimeSlot[],
  eventsByDay: Record<string, AgendaEvent[]> = {},
): AgendaTimeline {
  const itemsByDay = Object.fromEntries(
    days.map((day) => [day.key, { items: [], timedItems: [], allDayItems: [] }]),
  ) as AgendaTimeline['itemsByDay']
  const hours: number[] = []
  let hasAllDayItems = false
  for (const event of Object.values(eventsByDay).flat()) {
    const [hour, minute] = event.time.split(':').map(Number)
    hours.push(
      hour,
      Math.min(23, Math.floor((hour * 60 + minute + event.durationMinutes - 1) / 60)),
    )
  }
  for (const item of items) {
    const day = itemsByDay[item.date]
    if (!day) continue
    day.items.push(item)
    if (item.time) {
      day.timedItems.push(item)
      const [hour, minute] = item.time.split(':').map(Number)
      hours.push(hour, Math.min(23, Math.floor((hour * 60 + minute + 60) / 60)))
    } else {
      day.allDayItems.push(item)
      hasAllDayItems = true
    }
  }
  const firstHour = Math.min(timeSlots[0]?.hour ?? 8, ...hours)
  const lastHour = Math.max(timeSlots.at(-1)?.hour ?? 18, ...hours)
  return {
    itemsByDay,
    firstHour,
    hasAllDayItems,
    calendarTimeSlots: Array.from({ length: lastHour - firstHour + 1 }, (_, index) => ({
      hour: firstHour + index,
      label: `${String(firstHour + index).padStart(2, '0')}:00`,
    })),
  }
}
