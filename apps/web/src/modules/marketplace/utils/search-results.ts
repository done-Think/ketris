import type { SearchResultProperty } from '../types/search'

export function getCurrencyValue(price: string) {
  const [value = '0'] = price.match(/[\d.]+/) ?? []

  return Number(value.replace(/\./g, ''))
}

export function getFeatureNumber(property: SearchResultProperty, key: string) {
  const detail = property.details.find((item) => item.key === key)
  const [value = '0'] = detail?.label.match(/\d+/) ?? []

  return Number(value)
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function normalizeLocationFilter(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
