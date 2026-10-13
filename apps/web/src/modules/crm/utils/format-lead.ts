import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'
import { formatRelativeDate } from './formatters'

export function formatLeadRelativeDate(
  value: string,
  locale: AppLocale = defaultLocale,
  now = new Date(),
): string {
  return formatRelativeDate(value, now, locale)
}
