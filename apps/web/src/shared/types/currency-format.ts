import type { currencyOptions } from '@shared/config/currency'

export type CurrencyFormatOptions = CurrencyPrecision & typeof currencyOptions

export type CurrencyNumberFormatter = (value: number, options: CurrencyFormatOptions) => string

export type CurrencyPrecision = Pick<
  Intl.NumberFormatOptions,
  'minimumFractionDigits' | 'maximumFractionDigits' | 'notation'
>
