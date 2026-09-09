import dayjs from 'dayjs'

import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import type { AgendaCalendarDay, AgendaEvent, AgendaWeekRange } from '../types/agenda-event'

export const agendaVisibleDayCount = 5

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function isVisitEvent(event: AgendaEvent) {
  return event.title.toLocaleLowerCase('pt-BR').includes('visita')
}

export function buildAgendaCalendarDays(weekStartDate: dayjs.Dayjs): AgendaCalendarDay[] {
  const today = dayjs().locale('pt-br').startOf('day')

  return Array.from({ length: agendaVisibleDayCount }, (_, index) => {
    const date = weekStartDate.add(index, 'day')

    return {
      dateLabel: date.format('DD'),
      dayLabel: capitalize(date.format('ddd').replace('.', '')),
      key: date.format('YYYY-MM-DD'),
      monthLabel: capitalize(date.format('MMM').replace('.', '')),
      today: date.isSame(today, 'day'),
    }
  })
}

export function getAgendaWeekRange(days: AgendaCalendarDay[]): AgendaWeekRange {
  const [startDay] = days
  const endDay = days.at(-1) ?? startDay
  const sameMonth = startDay.monthLabel === endDay.monthLabel

  return {
    startLabel: sameMonth ? startDay.dateLabel : `${startDay.dateLabel} ${startDay.monthLabel}`,
    endLabel: `${endDay.dateLabel} ${endDay.monthLabel}`,
  }
}

export function getAgendaNotifications(
  events: AgendaEvent[],
  today: dayjs.Dayjs,
): DashboardNotificationItem[] {
  return events.flatMap((event) => {
    const eventDate = dayjs(event.scheduledDate)
    const notifications: DashboardNotificationItem[] = []

    if (eventDate.isSame(today, 'day') && isVisitEvent(event)) {
      notifications.push({
        id: `${event.id}-today-visit`,
        kind: 'todayVisit',
        message: `${event.time} - ${event.participant} em ${event.property}`,
        metadata: { eventId: event.id },
        title: 'Visita marcada para hoje',
      })
    }

    if (event.createdBy && event.createdByRole) {
      notifications.push({
        id: `${event.id}-assigned`,
        kind: 'assignedEvent',
        message: `${event.createdByRole} ${event.createdBy} marcou ${event.title}`,
        metadata: { eventId: event.id },
        title: 'Novo compromisso atribuído',
      })
    }

    return notifications
  })
}
