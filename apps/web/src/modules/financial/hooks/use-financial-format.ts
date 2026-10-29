import { useFormatter } from 'next-intl'
import { useCallback, useMemo } from 'react'

import { calendarDate, monthDate } from '../utils/month'

export function useFinancialFormat() {
  const format = useFormatter()
  const currency = useCallback(
    (value: number) => format.number(value, { style: 'currency', currency: 'BRL' }),
    [format],
  )
  const date = useCallback(
    (value: string) =>
      format.dateTime(calendarDate(value), { dateStyle: 'short', timeZone: 'UTC' }),
    [format],
  )
  const dayMonth = useCallback(
    (value: string) =>
      format.dateTime(calendarDate(value), { day: '2-digit', month: 'short', timeZone: 'UTC' }),
    [format],
  )
  const dateTime = useCallback(
    (value: string) => format.dateTime(new Date(value), { dateStyle: 'short', timeStyle: 'short' }),
    [format],
  )
  const month = useCallback(
    (value: string) =>
      format.dateTime(monthDate(value), { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [format],
  )
  const shortMonth = useCallback(
    (year: number, monthNumber: number) =>
      format
        .dateTime(new Date(Date.UTC(year, monthNumber - 1, 1)), { month: 'short', timeZone: 'UTC' })
        .replace(/\.$/, ''),
    [format],
  )
  const percent = useCallback(
    (value: number) =>
      format.number(value / 100, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [format],
  )
  const fileSize = useCallback(
    (bytes: number) =>
      bytes >= 1024 * 1024
        ? `${format.number(bytes / (1024 * 1024), { maximumFractionDigits: 1 })} MB`
        : `${format.number(Math.max(1, Math.round(bytes / 1024)))} KB`,
    [format],
  )

  return useMemo(
    () => ({ currency, date, dayMonth, dateTime, month, shortMonth, percent, fileSize }),
    [currency, date, dayMonth, dateTime, month, shortMonth, percent, fileSize],
  )
}
