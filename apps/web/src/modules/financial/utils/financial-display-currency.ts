import type { AppLocale } from '@/i18n/types/locale.types'

export type DisplayCurrency = 'BRL' | 'EUR' | 'USD'

export type FinancialExchangeRate = {
  currency: 'EUR' | 'USD'
  brlPerUnit: number
  date: string
}

export function targetCurrencyForLocale(locale: AppLocale): DisplayCurrency {
  if (locale === 'es-ES') return 'EUR'
  if (locale === 'en-US') return 'USD'
  return 'BRL'
}

export function convertFinancialAmount(
  amountInBrl: number,
  locale: AppLocale,
  exchangeRate?: FinancialExchangeRate | null,
): { amount: number; currency: DisplayCurrency } {
  const targetCurrency = targetCurrencyForLocale(locale)
  if (
    targetCurrency === 'BRL' ||
    !exchangeRate ||
    exchangeRate.currency !== targetCurrency ||
    !Number.isFinite(exchangeRate.brlPerUnit) ||
    exchangeRate.brlPerUnit <= 0
  ) {
    return { amount: amountInBrl, currency: 'BRL' }
  }

  return { amount: amountInBrl / exchangeRate.brlPerUnit, currency: targetCurrency }
}

export function formatFinancialAmount(
  amountInBrl: number,
  locale: AppLocale,
  exchangeRate?: FinancialExchangeRate | null,
  maximumFractionDigits = 2,
): string {
  const { amount, currency } = convertFinancialAmount(amountInBrl, locale, exchangeRate)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount)
}
