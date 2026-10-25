import dayjs, { type Dayjs } from 'dayjs'
import { AGENDA_BUSINESS_HOURS_START } from '@shared/lib/utils/agenda-scheduling'

import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import type {
  AgendaBuildNotificationsOptions,
  AgendaCalendarDay,
  AgendaEvent,
  AgendaWeekRange,
} from '../types/agenda-event'

export const agendaVisibleDayCount = 5
export const scheduleStartHour = AGENDA_BUSINESS_HOURS_START
export const scheduleHourHeight = 62

export function getEventOffsetTop(time: string, startHour = scheduleStartHour) {
  const [hour = scheduleStartHour, minute = 0] = time.split(':').map(Number)

  return (hour - startHour) * scheduleHourHeight + (minute / 60) * scheduleHourHeight
}

export function getEventHeight(durationMinutes: number) {
  return Math.max((durationMinutes / 60) * scheduleHourHeight, 38)
}

function resolveDayjsLocale(locale: string) {
  if (locale.startsWith('pt')) return 'pt-br'
  if (locale.startsWith('es')) return 'es'

  return 'en'
}

function capitalize(value: string, locale: string) {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1)
}

export function buildAgendaCalendarDays(weekStartDate: Dayjs, locale: string): AgendaCalendarDay[] {
  const dayjsLocale = resolveDayjsLocale(locale)
  const today = dayjs().locale(dayjsLocale).startOf('day')

  return Array.from({ length: agendaVisibleDayCount }, (_, index) => {
    const date = weekStartDate.add(index, 'day').locale(dayjsLocale)

    return {
      dateLabel: date.format('DD'),
      dayLabel: capitalize(date.format('ddd').replace('.', ''), locale),
      key: date.format('YYYY-MM-DD'),
      monthLabel: capitalize(date.format('MMM').replace('.', ''), locale),
      monthLongLabel: capitalize(date.format('MMMM'), locale),
      today: date.isSame(today, 'day'),
    }
  })
}

export function getEventEndTime(
  event: Pick<AgendaEvent, 'durationMinutes' | 'scheduledDate' | 'time'>,
) {
  return dayjs(`${event.scheduledDate}T${event.time}`)
    .add(event.durationMinutes, 'minute')
    .format('HH:mm')
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

function isVisitEvent(event: AgendaEvent) {
  return event.apiKind === 'VISIT'
}

export function getAgendaNotifications({
  events,
  currentUserId,
  t,
  today,
}: AgendaBuildNotificationsOptions): DashboardNotificationItem[] {
  return events.flatMap((event) => {
    const eventDate = dayjs(event.scheduledDate)
    const notifications: DashboardNotificationItem[] = []
    const href = { pathname: '/dashboard/agenda' as const, query: { eventId: event.id } }

    if (eventDate.isSame(today, 'day') && isVisitEvent(event)) {
      notifications.push({
        href,
        id: `${event.id}-today-visit`,
        kind: 'todayVisit',
        message: t('todayVisitMessage', {
          participant: event.participant,
          property: event.property,
          time: event.time,
        }),
        title: t('todayVisitTitle'),
      })
    }

    if (
      event.createdBy &&
      event.createdByRole &&
      currentUserId &&
      event.responsibleId === currentUserId &&
      event.createdById &&
      event.createdById !== currentUserId
    ) {
      notifications.push({
        href,
        id: `${event.id}-assigned`,
        kind: 'assignedEvent',
        message: t('assignedEventMessage', {
          name: event.createdBy,
          role: t(`creatorRoles.${event.createdByRole}`),
          title: event.title,
        }),
        title: t('assignedEventTitle'),
      })
    }

    return notifications
  })
}
