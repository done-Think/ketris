const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatPropertyCurrency(value: number): string {
  return currencyFormatter.format(value).replace(/ /g, ' ')
}

export function formatPropertyArea(value: number | null, fallback = 'Não informado'): string {
  return value !== null ? `${value}m²` : fallback
}

export function formatPropertyRelativeDate(
  value: string,
  localeOrCapitalize: string | boolean = 'pt-BR',
  capitalizeFirstLetter = false,
): string {
  const locale = typeof localeOrCapitalize === 'string' ? localeOrCapitalize : 'pt-BR'
  const shouldCapitalize =
    typeof localeOrCapitalize === 'boolean' ? localeOrCapitalize : capitalizeFirstLetter
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const target = new Date(value)
  const differenceInSeconds = Math.round((target.getTime() - Date.now()) / 1000)
  const absoluteSeconds = Math.abs(differenceInSeconds)

  if (absoluteSeconds < 60) {
    const formatted = relativeTimeFormatter.format(0, 'second')

    return shouldCapitalize ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : formatted
  }

  const units = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
  ] as const

  const selected = units.find(({ seconds }) => absoluteSeconds >= seconds) ?? units.at(-1)!
  const amount = Math.round(differenceInSeconds / selected.seconds)
  const formatted = relativeTimeFormatter.format(amount, selected.unit)

  return shouldCapitalize ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : formatted
}
