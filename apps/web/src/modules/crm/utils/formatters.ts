import { formatCurrency as formatSharedCurrency } from '@shared/lib/utils/format'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

export function formatCurrency(value: number, locale: AppLocale = defaultLocale): string {
  return formatSharedCurrency(value, locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatMonthlyCurrency(
  value: number,
  monthlySuffix: string,
  locale: AppLocale = defaultLocale,
): string {
  return `${formatCurrency(value, locale)}${monthlySuffix}`
}

export function formatDate(value: string | Date, locale: AppLocale = defaultLocale): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function formatRelativeDate(
  value: string | Date,
  now = new Date(),
  locale: AppLocale = defaultLocale,
): string {
  const target = new Date(value)
  const differenceInSeconds = Math.round((target.getTime() - now.getTime()) / 1000)
  const absoluteSeconds = Math.abs(differenceInSeconds)

  if (absoluteSeconds < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second')
  }

  const units = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'week', seconds: 604_800 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
  ] as const

  const selected = units.find(({ seconds }) => absoluteSeconds >= seconds) ?? units.at(-1)!
  const amount = Math.round(differenceInSeconds / selected.seconds)

  return new Intl.RelativeTimeFormat(locale, {
    numeric: selected.unit === 'day' && amount === -1 ? 'auto' : 'always',
  }).format(amount, selected.unit)
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}
