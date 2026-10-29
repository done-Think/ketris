export type CurrencyFormatOptions = CurrencyPrecision & { style: 'currency'; currency: 'BRL' }

export type CurrencyNumberFormatter = (value: number, options: CurrencyFormatOptions) => string

export type CurrencyPrecision = Pick<
  Intl.NumberFormatOptions,
  'minimumFractionDigits' | 'maximumFractionDigits'
>
