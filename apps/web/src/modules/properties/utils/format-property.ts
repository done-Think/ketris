import type { PropertyFormatter } from '../types/dashboard-property'

export function formatPropertyCurrency(value: number, formatter: PropertyFormatter): string {
  return formatter
    .number(value, {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    })
    .replace(/\u00a0/g, ' ')
}

export function formatPropertyArea(
  value: number | null,
  fallback: string,
  formatter: PropertyFormatter,
): string {
  return value !== null ? `${formatter.number(value)}m²` : fallback
}

export function formatPropertyRelativeDate(
  value: string,
  formatter: PropertyFormatter,
  capitalizeFirstLetter = false,
): string {
  const formatted = formatter.relativeTime(new Date(value), { now: Date.now() })
  return capitalizeFirstLetter ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : formatted
}
