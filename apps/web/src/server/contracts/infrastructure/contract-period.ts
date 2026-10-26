import { defaultTimeZone } from '@/i18n/formats'

export function contractPeriodDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: defaultTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  const today = new Date(part('year') + '-' + part('month') + '-' + part('day') + 'T00:00:00.000Z')
  const afterDays = (days: number) => new Date(today.getTime() + days * 86400000)
  return {
    today,
    after30: afterDays(31),
    after90: afterDays(91),
    nextMonth: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)),
  }
}
