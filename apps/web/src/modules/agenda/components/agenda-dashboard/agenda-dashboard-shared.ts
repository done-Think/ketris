import dayjs, { type Dayjs } from 'dayjs'

import { alpha, brand, supportColor } from '@shared/theme/tokens'

import type {
  AgendaBuildNotificationsOptions,
  AgendaCalendarDay,
  AgendaEventTone,
  AgendaEventToneStyle,
  AgendaNotification,
  AgendaWeekRange,
} from '../../types/agenda-event'

export const agendaVisibleDayCount = 5
export const scheduleStartHour = 8
export const scheduleEndHour = 18
export const scheduleHourHeight = 62
export const scheduleTimelineHeight = (scheduleEndHour - scheduleStartHour + 1) * scheduleHourHeight

export const agendaEventToneStyles: Record<AgendaEventTone, AgendaEventToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[10],
    borderColor: brand.magenta[500],
    color: brand.magenta[600],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    borderColor: brand.semantic.info,
    color: brand.semantic.info,
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    borderColor: brand.semantic.warning,
    color: brand.semantic.warning,
  },
}

export function getEventOffsetTop(time: string) {
  const [hour = scheduleStartHour, minute = 0] = time.split(':').map(Number)

  return (hour - scheduleStartHour) * scheduleHourHeight + (minute / 60) * scheduleHourHeight
}

export function getEventHeight(durationMinutes: number) {
  return Math.max((durationMinutes / 60) * scheduleHourHeight, 38)
}

export function getAgendaDayjsLocale(locale: string) {
  if (locale === 'pt-BR') return 'pt-br'
  if (locale === 'es-ES') return 'es'

  return 'en'
}

function capitalize(value: string, locale: string) {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1)
}

export function buildAgendaCalendarDays(weekStartDate: Dayjs, locale: string): AgendaCalendarDay[] {
  const dayjsLocale = getAgendaDayjsLocale(locale)
  const today = dayjs().locale(dayjsLocale).startOf('day')

  return Array.from({ length: agendaVisibleDayCount }, (_, index) => {
    const date = weekStartDate.locale(dayjsLocale).add(index, 'day')

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

export function getAgendaWeekRange(days: AgendaCalendarDay[]): AgendaWeekRange {
  const [startDay] = days
  const endDay = days.at(-1) ?? startDay
  const sameMonth = startDay.monthLabel === endDay.monthLabel

  return {
    startLabel: sameMonth ? startDay.dateLabel : `${startDay.dateLabel} ${startDay.monthLabel}`,
    endLabel: `${endDay.dateLabel} ${endDay.monthLabel}`,
  }
}

export function getAgendaNotifications({
  events,
  t,
  today,
}: AgendaBuildNotificationsOptions): AgendaNotification[] {
  return events.flatMap((event) => {
    const eventDate = dayjs(event.scheduledDate)
    const notifications: AgendaNotification[] = []

    if (eventDate.isSame(today, 'day') && event.kind === 'visit') {
      notifications.push({
        event,
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

    if (event.createdBy && event.createdByRole) {
      notifications.push({
        event,
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
