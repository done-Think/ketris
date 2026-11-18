import type { AppLocale } from '@/i18n/types/locale.types'
import { defaultLocale } from '@/i18n/routing'
import { formatCurrency } from './format'

export function parseLeadBudget(value: string): number | null {
  const trimmed = value.trim()
  if (/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    const amount = Number(trimmed)
    return Number.isFinite(amount) ? amount : null
  }
  const localized = /^(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(trimmed)
  if (!localized) return null
  const amount = Number(localized[1].replaceAll('.', '') + '.' + (localized[2] ?? '0'))
  return Number.isFinite(amount) ? amount : null
}

export function formatLeadBudget(value: string, locale: AppLocale = defaultLocale): string {
  const amount = parseLeadBudget(value)
  return amount === null ? value : formatCurrency(amount, locale)
}
