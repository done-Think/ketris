import { formatCurrency } from '@shared/lib/utils/format'
import type { SearchResultProperty } from '../types/search'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

export function getCurrencyValue(price: string) {
  const [value = '0'] = price.match(/[\d.]+/) ?? []

  return Number(value.replace(/\./g, ''))
}

export function getFeatureNumber(property: SearchResultProperty, key: string) {
  const detail = property.details.find((item) => item.key === key)
  const [value = '0'] = detail?.label.match(/\d+/) ?? []

  return Number(value)
}

export function formatCompactCurrency(value: number, locale: AppLocale = defaultLocale) {
  return formatCurrency(value, locale, { maximumFractionDigits: 0 })
}

export function normalizeLocationFilter(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
