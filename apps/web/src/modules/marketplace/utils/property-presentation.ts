import type { AppLocale } from '@/i18n/types/locale.types'

export function formatPropertyArea(area: number, locale: AppLocale): string {
  return `${new Intl.NumberFormat(locale).format(area)} m²`
}
