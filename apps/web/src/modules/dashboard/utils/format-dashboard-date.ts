import { defaultTimeZone } from '@/i18n/formats'

export function formatDashboardDate(locale: string, date: Date = new Date()): string {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
    timeZone: defaultTimeZone,
  }).format(date)

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}
