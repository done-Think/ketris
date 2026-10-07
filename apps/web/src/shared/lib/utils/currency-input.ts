export function formatIntegerCurrencyInput(value: unknown, locale: string) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) return ''

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numericValue)
}

export function getNumberSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
  const group = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'

  return { group, decimal }
}

export function parseIntegerCurrencyInput(value: string, locale: string) {
  const { group, decimal } = getNumberSeparators(locale)
  const integerPart = value.split(decimal)[0] ?? ''
  const digits = integerPart.split(group).join('').replace(/\D/g, '')

  return digits ? Number(digits) : 0
}
