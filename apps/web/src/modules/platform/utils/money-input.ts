import { getNumberSeparators } from '@shared/lib/utils/currency-input'

// Money typed with cents in the locale's format ("1.234,56" in pt-BR, "1,234.56" in en-US).
// Returns null when the text is not a valid amount with at most two decimals.
export function parseMoneyInput(value: string, locale: string): number | null {
  const { group, decimal } = getNumberSeparators(locale)
  const normalized = value.trim().split(group).join('').replace(decimal, '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  return Number(normalized)
}

export function formatMoneyInput(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
