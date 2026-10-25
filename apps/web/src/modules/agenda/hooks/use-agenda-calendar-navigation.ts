import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
  agendaVisibleDayCount,
  buildAgendaCalendarDays,
  getAgendaWeekRange,
} from '../utils/agenda-calendar'

export function useAgendaCalendarNavigation(isRenter: boolean, locale: string) {
  const today = useMemo(() => dayjs().startOf('day'), [])
  const horizonEnd = useMemo(() => today.add(6, 'month').endOf('month'), [today])
  const start = isRenter ? today.subtract(6, 'month') : today
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const days = useMemo(
    () => buildAgendaCalendarDays(weekStartDate, locale),
    [locale, weekStartDate],
  )
  const next = weekStartDate.add(agendaVisibleDayCount, 'day')
  const previous = weekStartDate.subtract(agendaVisibleDayCount, 'day')

  function showScheduledWeek(date: dayjs.Dayjs) {
    if (date.isBefore(today, 'day')) {
      setWeekStartDate(today)
      return
    }
    const offset =
      Math.floor(date.startOf('day').diff(today, 'day') / agendaVisibleDayCount) *
      agendaVisibleDayCount
    setWeekStartDate(today.add(offset, 'day'))
  }
  return {
    today,
    horizonEnd,
    start,
    days,
    weekRange: getAgendaWeekRange(days),
    showScheduledWeek,
    disablePreviousWeek: !previous.isAfter(start.subtract(1, 'day'), 'day'),
    disableNextWeek: next.isAfter(horizonEnd, 'day'),
    onPreviousWeek: () => setWeekStartDate(previous),
    onNextWeek: () => setWeekStartDate(next),
  }
}
