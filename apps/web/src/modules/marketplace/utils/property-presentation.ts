import type { AppLocale } from '@/i18n/types/locale.types'

export type PropertyText = (
  key: 'bedrooms' | 'bathrooms' | 'parking' | 'monthly',
  values: { count: number } | { price: string },
) => string

export function formatPropertyArea(area: number, locale: AppLocale): string {
  return `${new Intl.NumberFormat(locale).format(area)} m²`
}
