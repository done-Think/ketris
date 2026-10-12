import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import 'dayjs/locale/es'

import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

const dayjsLocales: Record<AppLocale, string> = {
  'pt-BR': 'pt-br',
  'en-US': 'en',
  'es-ES': 'es',
}

export function formatCurrency(value: number, locale: AppLocale = defaultLocale): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(
  date: string | Date,
  pattern?: string,
  locale: AppLocale = defaultLocale,
): string {
  const parsed = dayjs(date).locale(dayjsLocales[locale])

  if (pattern) return parsed.format(pattern)

  const calendarDate = new Date(Date.UTC(parsed.year(), parsed.month(), parsed.date()))
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(calendarDate)
}
